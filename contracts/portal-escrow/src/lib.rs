#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod portal_escrow {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    pub type EscrowId = u64;
    pub type MilestoneId = u32;

    #[derive(scale::Encode, scale::Decode, Clone, Debug, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub enum MilestoneState {
        Created,
        Funded,
        Submitted,
        Released,
        TimeoutClaimed,
    }

    #[derive(scale::Encode, scale::Decode, Clone, Debug, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub enum EscrowStatus {
        Created,
        Funded,
        InProgress,
        Completed,
    }

    #[derive(scale::Encode, scale::Decode, Clone, Debug, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub struct MilestoneInput {
        pub title: String,
        pub amount: Balance,
    }

    #[derive(scale::Encode, scale::Decode, Clone, Debug, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub struct Milestone {
        pub title: String,
        pub amount: Balance,
        pub state: MilestoneState,
        pub submitted_at: Option<Timestamp>,
        pub released_at: Option<Timestamp>,
        pub claimed_by_timeout: bool,
    }

    #[derive(scale::Encode, scale::Decode, Clone, Debug, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo, ink::storage::traits::StorageLayout))]
    pub struct Escrow {
        pub id: EscrowId,
        pub client: AccountId,
        pub freelancer: AccountId,
        pub title: String,
        pub description: String,
        pub total_amount: Balance,
        pub locked_amount: Balance,
        pub released_amount: Balance,
        pub claim_timeout_ms: u64,
        pub created_at: Timestamp,
        pub funded_at: Option<Timestamp>,
        pub status: EscrowStatus,
        pub milestones: Vec<Milestone>,
    }

    #[derive(scale::Encode, scale::Decode, Clone, Debug, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        EmptyMilestones,
        MilestoneTotalMismatch,
        EscrowNotFound,
        AlreadyFunded,
        NotFunded,
        InvalidCaller,
        InvalidMilestone,
        InvalidTransition,
        AlreadyCompleted,
        PaymentMismatch,
        TimeoutNotReached,
        TransferFailed,
        ZeroAmount,
    }

    pub type Result<T> = core::result::Result<T, Error>;

    #[ink(event)]
    pub struct EscrowCreated {
        #[ink(topic)]
        escrow_id: EscrowId,
        #[ink(topic)]
        client: AccountId,
        #[ink(topic)]
        freelancer: AccountId,
        total_amount: Balance,
    }

    #[ink(event)]
    pub struct EscrowFunded {
        #[ink(topic)]
        escrow_id: EscrowId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct MilestoneSubmitted {
        #[ink(topic)]
        escrow_id: EscrowId,
        milestone_id: MilestoneId,
        submitted_at: Timestamp,
    }

    #[ink(event)]
    pub struct MilestoneReleased {
        #[ink(topic)]
        escrow_id: EscrowId,
        milestone_id: MilestoneId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct TimeoutClaimed {
        #[ink(topic)]
        escrow_id: EscrowId,
        milestone_id: MilestoneId,
        amount: Balance,
    }

    #[ink(storage)]
    pub struct PortalEscrow {
        next_escrow_id: EscrowId,
        escrows: Mapping<EscrowId, Escrow>,
        created_by: Mapping<AccountId, Vec<EscrowId>>,
        assigned_to: Mapping<AccountId, Vec<EscrowId>>,
    }

    impl Default for PortalEscrow {
        fn default() -> Self {
            Self::new()
        }
    }

    impl PortalEscrow {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                next_escrow_id: 1,
                escrows: Mapping::default(),
                created_by: Mapping::default(),
                assigned_to: Mapping::default(),
            }
        }

        #[ink(message)]
        pub fn create_escrow(
            &mut self,
            freelancer: AccountId,
            title: String,
            description: String,
            total_amount: Balance,
            milestones: Vec<MilestoneInput>,
            claim_timeout_ms: u64,
        ) -> Result<EscrowId> {
            if total_amount == 0 {
                return Err(Error::ZeroAmount);
            }
            if milestones.is_empty() {
                return Err(Error::EmptyMilestones);
            }
            let sum = milestones.iter().fold(0u128, |acc, m| acc.saturating_add(m.amount));
            if sum != total_amount {
                return Err(Error::MilestoneTotalMismatch);
            }

            let caller = self.env().caller();
            let id = self.next_escrow_id;
            self.next_escrow_id = self.next_escrow_id.saturating_add(1);
            let escrow = Escrow {
                id,
                client: caller,
                freelancer,
                title,
                description,
                total_amount,
                locked_amount: 0,
                released_amount: 0,
                claim_timeout_ms,
                created_at: self.env().block_timestamp(),
                funded_at: None,
                status: EscrowStatus::Created,
                milestones: milestones
                    .into_iter()
                    .map(|m| Milestone {
                        title: m.title,
                        amount: m.amount,
                        state: MilestoneState::Created,
                        submitted_at: None,
                        released_at: None,
                        claimed_by_timeout: false,
                    })
                    .collect(),
            };
            self.escrows.insert(id, &escrow);
            self.push_index(caller, freelancer, id);
            self.env().emit_event(EscrowCreated {
                escrow_id: id,
                client: caller,
                freelancer,
                total_amount,
            });
            Ok(id)
        }

        #[ink(message, payable)]
        pub fn fund_escrow(&mut self, escrow_id: EscrowId) -> Result<()> {
            let caller = self.env().caller();
            let mut escrow = self.get_existing(escrow_id)?;
            if caller != escrow.client {
                return Err(Error::InvalidCaller);
            }
            if escrow.status != EscrowStatus::Created {
                return Err(Error::AlreadyFunded);
            }
            let transferred = self.env().transferred_value();
            if transferred != escrow.total_amount {
                return Err(Error::PaymentMismatch);
            }
            escrow.locked_amount = transferred;
            escrow.funded_at = Some(self.env().block_timestamp());
            escrow.status = EscrowStatus::Funded;
            for milestone in escrow.milestones.iter_mut() {
                milestone.state = MilestoneState::Funded;
            }
            self.escrows.insert(escrow_id, &escrow);
            self.env().emit_event(EscrowFunded { escrow_id, amount: transferred });
            Ok(())
        }

        #[ink(message)]
        pub fn submit_milestone(&mut self, escrow_id: EscrowId, milestone_id: MilestoneId) -> Result<()> {
            let caller = self.env().caller();
            let now = self.env().block_timestamp();
            let mut escrow = self.get_existing(escrow_id)?;
            if caller != escrow.freelancer {
                return Err(Error::InvalidCaller);
            }
            if escrow.status == EscrowStatus::Created {
                return Err(Error::NotFunded);
            }
            let milestone = escrow
                .milestones
                .get_mut(milestone_id as usize)
                .ok_or(Error::InvalidMilestone)?;
            if milestone.state != MilestoneState::Funded {
                return Err(Error::InvalidTransition);
            }
            milestone.state = MilestoneState::Submitted;
            milestone.submitted_at = Some(now);
            escrow.status = EscrowStatus::InProgress;
            self.escrows.insert(escrow_id, &escrow);
            self.env().emit_event(MilestoneSubmitted { escrow_id, milestone_id, submitted_at: now });
            Ok(())
        }

        #[ink(message)]
        pub fn approve_milestone(&mut self, escrow_id: EscrowId, milestone_id: MilestoneId) -> Result<()> {
            let caller = self.env().caller();
            let mut escrow = self.get_existing(escrow_id)?;
            if caller != escrow.client {
                return Err(Error::InvalidCaller);
            }
            let amount = Self::release_milestone_state(&mut escrow, milestone_id, false, self.env().block_timestamp())?;
            self.env().transfer(escrow.freelancer, amount).map_err(|_| Error::TransferFailed)?;
            self.finalize_after_payment(escrow_id, escrow, milestone_id, amount, false);
            Ok(())
        }

        #[ink(message)]
        pub fn claim_timeout(&mut self, escrow_id: EscrowId, milestone_id: MilestoneId) -> Result<()> {
            let caller = self.env().caller();
            let now = self.env().block_timestamp();
            let mut escrow = self.get_existing(escrow_id)?;
            if caller != escrow.freelancer {
                return Err(Error::InvalidCaller);
            }
            let submitted_at = escrow
                .milestones
                .get(milestone_id as usize)
                .ok_or(Error::InvalidMilestone)?
                .submitted_at
                .ok_or(Error::InvalidTransition)?;
            if now < submitted_at.saturating_add(escrow.claim_timeout_ms) {
                return Err(Error::TimeoutNotReached);
            }
            let amount = Self::release_milestone_state(&mut escrow, milestone_id, true, now)?;
            self.env().transfer(escrow.freelancer, amount).map_err(|_| Error::TransferFailed)?;
            self.finalize_after_payment(escrow_id, escrow, milestone_id, amount, true);
            Ok(())
        }

        #[ink(message)]
        pub fn get_escrow(&self, escrow_id: EscrowId) -> Option<Escrow> {
            self.escrows.get(escrow_id)
        }

        #[ink(message)]
        pub fn get_created_by(&self, account: AccountId) -> Vec<EscrowId> {
            self.created_by.get(account).unwrap_or_default()
        }

        #[ink(message)]
        pub fn get_assigned_to(&self, account: AccountId) -> Vec<EscrowId> {
            self.assigned_to.get(account).unwrap_or_default()
        }

        #[ink(message)]
        pub fn next_escrow_id(&self) -> EscrowId {
            self.next_escrow_id
        }

        fn get_existing(&self, escrow_id: EscrowId) -> Result<Escrow> {
            self.escrows.get(escrow_id).ok_or(Error::EscrowNotFound)
        }

        fn push_index(&mut self, client: AccountId, freelancer: AccountId, id: EscrowId) {
            let mut created = self.created_by.get(client).unwrap_or_default();
            created.push(id);
            self.created_by.insert(client, &created);
            let mut assigned = self.assigned_to.get(freelancer).unwrap_or_default();
            assigned.push(id);
            self.assigned_to.insert(freelancer, &assigned);
        }

        fn release_milestone_state(escrow: &mut Escrow, milestone_id: MilestoneId, timeout: bool, now: Timestamp) -> Result<Balance> {
            let milestone = escrow
                .milestones
                .get_mut(milestone_id as usize)
                .ok_or(Error::InvalidMilestone)?;
            if milestone.state != MilestoneState::Submitted {
                return Err(Error::InvalidTransition);
            }
            let amount = milestone.amount;
            if escrow.locked_amount < amount {
                return Err(Error::PaymentMismatch);
            }
            escrow.locked_amount = escrow.locked_amount.saturating_sub(amount);
            escrow.released_amount = escrow.released_amount.saturating_add(amount);
            milestone.released_at = Some(now);
            milestone.claimed_by_timeout = timeout;
            milestone.state = if timeout { MilestoneState::TimeoutClaimed } else { MilestoneState::Released };
            Ok(amount)
        }

        fn finalize_after_payment(
            &mut self,
            escrow_id: EscrowId,
            mut escrow: Escrow,
            milestone_id: MilestoneId,
            amount: Balance,
            timeout: bool,
        ) {
            if escrow.milestones.iter().all(|m| matches!(m.state, MilestoneState::Released | MilestoneState::TimeoutClaimed)) {
                escrow.status = EscrowStatus::Completed;
            }
            self.escrows.insert(escrow_id, &escrow);
            if timeout {
                self.env().emit_event(TimeoutClaimed { escrow_id, milestone_id, amount });
            } else {
                self.env().emit_event(MilestoneReleased { escrow_id, milestone_id, amount });
            }
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::test;

        fn accounts() -> test::DefaultAccounts<ink::env::DefaultEnvironment> {
            test::default_accounts::<ink::env::DefaultEnvironment>()
        }

        fn set_caller(caller: AccountId) {
            test::set_caller::<ink::env::DefaultEnvironment>(caller);
        }

        fn set_value(value: Balance) {
            test::set_value_transferred::<ink::env::DefaultEnvironment>(value);
        }

        fn sample_milestones() -> Vec<MilestoneInput> {
            vec![
                MilestoneInput { title: String::from("Design"), amount: 40 },
                MilestoneInput { title: String::from("Build"), amount: 60 },
            ]
        }

        fn create(contract: &mut PortalEscrow) -> EscrowId {
            let a = accounts();
            set_caller(a.alice);
            contract
                .create_escrow(a.bob, String::from("Website"), String::from("Landing page"), 100, sample_milestones(), 1_000)
                .expect("create works")
        }

        fn fund(contract: &mut PortalEscrow, id: EscrowId) {
            let a = accounts();
            set_caller(a.alice);
            set_value(100);
            contract.fund_escrow(id).expect("fund works");
            set_value(0);
        }

        #[ink::test]
        fn create_escrow_validates_totals_and_indexes() {
            let a = accounts();
            let mut contract = PortalEscrow::new();
            set_caller(a.alice);
            assert_eq!(contract.create_escrow(a.bob, "Bad".into(), "Mismatch".into(), 101, sample_milestones(), 100), Err(Error::MilestoneTotalMismatch));
            let id = create(&mut contract);
            let escrow = contract.get_escrow(id).unwrap();
            assert_eq!(escrow.client, a.alice);
            assert_eq!(escrow.freelancer, a.bob);
            assert_eq!(escrow.status, EscrowStatus::Created);
            assert_eq!(contract.get_created_by(a.alice), vec![id]);
            assert_eq!(contract.get_assigned_to(a.bob), vec![id]);
        }

        #[ink::test]
        fn fund_escrow_requires_client_and_exact_amount() {
            let a = accounts();
            let mut contract = PortalEscrow::new();
            let id = create(&mut contract);
            set_caller(a.bob);
            set_value(100);
            assert_eq!(contract.fund_escrow(id), Err(Error::InvalidCaller));
            set_caller(a.alice);
            set_value(99);
            assert_eq!(contract.fund_escrow(id), Err(Error::PaymentMismatch));
            fund(&mut contract, id);
            let escrow = contract.get_escrow(id).unwrap();
            assert_eq!(escrow.locked_amount, 100);
            assert_eq!(escrow.milestones[0].state, MilestoneState::Funded);
        }

        #[ink::test]
        fn submit_milestone_requires_freelancer_and_funded_state() {
            let a = accounts();
            let mut contract = PortalEscrow::new();
            let id = create(&mut contract);
            set_caller(a.bob);
            assert_eq!(contract.submit_milestone(id, 0), Err(Error::NotFunded));
            fund(&mut contract, id);
            set_caller(a.charlie);
            assert_eq!(contract.submit_milestone(id, 0), Err(Error::InvalidCaller));
            set_caller(a.bob);
            contract.submit_milestone(id, 0).unwrap();
            assert_eq!(contract.get_escrow(id).unwrap().milestones[0].state, MilestoneState::Submitted);
            assert_eq!(contract.submit_milestone(id, 0), Err(Error::InvalidTransition));
        }

        #[ink::test]
        fn release_milestone_pays_once_and_updates_locked_amount() {
            let a = accounts();
            let mut contract = PortalEscrow::new();
            let id = create(&mut contract);
            fund(&mut contract, id);
            set_caller(a.bob);
            contract.submit_milestone(id, 0).unwrap();
            set_caller(a.bob);
            assert_eq!(contract.approve_milestone(id, 0), Err(Error::InvalidCaller));
            set_caller(a.alice);
            contract.approve_milestone(id, 0).unwrap();
            let escrow = contract.get_escrow(id).unwrap();
            assert_eq!(escrow.locked_amount, 60);
            assert_eq!(escrow.released_amount, 40);
            assert_eq!(escrow.milestones[0].state, MilestoneState::Released);
            assert_eq!(contract.approve_milestone(id, 0), Err(Error::InvalidTransition));
        }

        #[ink::test]
        fn timeout_claim_requires_elapsed_timeout() {
            let a = accounts();
            let mut contract = PortalEscrow::new();
            let id = create(&mut contract);
            fund(&mut contract, id);
            set_caller(a.bob);
            test::set_block_timestamp::<ink::env::DefaultEnvironment>(10_000);
            contract.submit_milestone(id, 1).unwrap();
            test::set_block_timestamp::<ink::env::DefaultEnvironment>(10_999);
            assert_eq!(contract.claim_timeout(id, 1), Err(Error::TimeoutNotReached));
            test::set_block_timestamp::<ink::env::DefaultEnvironment>(11_000);
            contract.claim_timeout(id, 1).unwrap();
            let escrow = contract.get_escrow(id).unwrap();
            assert_eq!(escrow.locked_amount, 40);
            assert_eq!(escrow.released_amount, 60);
            assert_eq!(escrow.milestones[1].state, MilestoneState::TimeoutClaimed);
            assert!(escrow.milestones[1].claimed_by_timeout);
        }

        #[ink::test]
        fn all_milestones_completed_sets_escrow_completed() {
            let a = accounts();
            let mut contract = PortalEscrow::new();
            let id = create(&mut contract);
            fund(&mut contract, id);
            set_caller(a.bob);
            contract.submit_milestone(id, 0).unwrap();
            contract.submit_milestone(id, 1).unwrap();
            set_caller(a.alice);
            contract.approve_milestone(id, 0).unwrap();
            contract.approve_milestone(id, 1).unwrap();
            assert_eq!(contract.get_escrow(id).unwrap().status, EscrowStatus::Completed);
        }
    }
}
