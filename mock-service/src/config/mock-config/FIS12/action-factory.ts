import { MockSearchClass } from "./2.2.1/search/class";
import { MockSearchClass2 } from "./2.2.1/search2/class";
import { MockSearchClass3 } from "./2.2.1/search3/class";
import { MockOnSearchClass } from "./2.2.1/on_search/class";
import { MockOnSearchClass2 } from "./2.2.1/on_search2/class";
import { MockOnSearchClass3 } from "./2.2.1/on_search3/class";
import { MockProductDetailsFormClass } from "./2.2.1/form/product_details_form";
import { MockSelectClass } from "./2.2.1/select/class";
import { MockOnSelectClass } from "./2.2.1/on_select/class";
import type { MockAction } from "./classes/mock-action";
import { MockPersonalDetailsInformationFormClass } from "./2.2.1/form2/personal_details_information_form";
import { MockDownPaymentFormClass } from "./2.2.1/form3/down_payment_form";
import { MockInitClass } from "./2.2.1/init/class";
import { MockOnInitClass } from "./2.2.1/on_init/class";
import { MockSelect1Class } from "./2.2.1/select1/class";
import { MockSelect2Class } from "./2.2.1/select2/class";
import { MockOnSelect1Class } from "./2.2.1/on_select1/class";
import { MockOnSelect2Class } from "./2.2.1/on_select2/class";
import { MockUpdateClass } from "./2.2.1/update/class";
import { MockOnUpdateClass } from "./2.2.1/on_update/class";
import { MockOnUpdateUnsolicitedClass } from "./2.2.1/on_update_unsolicited/class";
import { MockConfirmClass } from "./2.2.1/confirm/class";
import { MockOnConfirmClass } from "./2.2.1/on_confirm/class";
import { MockInitClass2 } from "./2.2.1/init2/class";
import { MockOnInitClass2 } from "./2.2.1/on_init2/class";
import { MockOnInitClass3 } from "./2.2.1/on_init3/class";
import { MockStatusClass } from "./2.2.1/status/class";
import { MockOnStatusClass } from "./2.2.1/on_status/class";
import { MockOnStatusUnsolicitedClass } from "./2.2.1/on_status_unsolicited/class";
import { MockSearchClass4 } from "./2.2.1/search4/class";
import { MockOnSearchClass4 } from "./2.2.1/on_search4/class";
import { MockSoftCancelClass } from "./2.2.1/soft_cancel/class";
import { MockConfirmedCancelClass } from "./2.2.1/confirmed_cancel/class";
import { MockConfirmedOnCancelClass } from "./2.2.1/confirmed_on_cancel/class";
import { MockSoftOnCancelClass } from "./2.2.1/soft_on_cancel/class";
import { MockOnUpdateUnsolicitedCancelClass } from "./2.2.1/on_update_unsolicited_cancel/class";
import { MockOnUpdateMissedEmiClass } from "./2.2.1/on_update_missed_Emi/class";
import { MockOnUpdateForeclosureClass } from "./2.2.1/on_update_foreclosure/class";
import { MockOnUpdatePrepartClass } from "./2.2.1/on_update_prepart/class";
import { MockUpdateMissedEmiClass } from "./2.2.1/update_missed_Emi/class";
import { MockUpdateForeclosureClass } from "./2.2.1/update_foreclosure/class";
import { MockUpdatePrepartClass } from "./2.2.1/update_prepart/class";
import { MockOnUpdateUnsolicitedMissedEmiClass } from "./2.2.1/on_update_unsolicited_missed_Emi/class";
import { MockOnUpdateUnsolicitedForeclosureClass } from "./2.2.1/on_update_unsolicited_foreclosure/class";
import { MockOnUpdateUnsolicitedPrepartClass } from "./2.2.1/on_update_unsolicited_prepart/class";
import { MockOnSearchClass5 } from "./2.2.1/on_search5/class";
import { MockOnSearchClass6 } from "./2.2.1/on_search6/class";
import { MockManadateDetailsFormClass } from "./2.2.1/form5/Emanadate_verification_status";
import { MockEkycDetailsFormClass } from "./2.2.1/form4/Ekyc_details_verification_status";
import { MockKycVerificationStatusClass } from "./2.2.1/form6/E_sign_verification_status";
import { MockPaymentFormClass } from "./2.2.1/form7/payment_url_form";

// types/helpers
type Ctor<T> = new () => T;

// === keep your imports exactly as they are ===

// Build a single source of truth registry
const registry = {
	// search
	search: MockSearchClass,
	search1_purchase_finance: MockSearchClass,
	search2_purchase_finance: MockSearchClass2,
	search3_purchase_finance: MockSearchClass3,
	search4_purchase_finance: MockSearchClass4,

	// on_search
	on_search: MockOnSearchClass,
	on_search1_purchase_finance: MockOnSearchClass,
	on_search2_purchase_finance: MockOnSearchClass2,
	on_search3_purchase_finance: MockOnSearchClass3,
	on_search4_purchase_finance: MockOnSearchClass4,
	on_search5_purchase_finance: MockOnSearchClass5,
	on_search6_purchase_finance: MockOnSearchClass6,

	// form
	product_details_form: MockProductDetailsFormClass,
	personal_details_information_form: MockPersonalDetailsInformationFormClass,
	down_payment_form: MockDownPaymentFormClass,
	Ekyc_details_verification_status: MockEkycDetailsFormClass,
	Emanadate_verification_status: MockManadateDetailsFormClass,
	E_sign_verification_status: MockKycVerificationStatusClass,
	payment_url_form: MockPaymentFormClass,

	// select
	select_purchase_finance: MockSelectClass,
	select1_purchase_finance: MockSelect1Class,
	select2_purchase_finance: MockSelect2Class,
	on_select_purchase_finance: MockOnSelectClass,
	on_select1_purchase_finance: MockOnSelect1Class,
	on_select2_purchase_finance: MockOnSelect2Class,

	// // init / on_init
	init1_purchase_finance: MockInitClass,
	on_init1_purchase_finance: MockOnInitClass,
	init2_purchase_finance: MockInitClass2,
	on_init2_purchase_finance: MockOnInitClass2,
	init3_purchase_finance: MockInitClass2,
	on_init3_purchase_finance: MockOnInitClass3,

	// // confirm / on_confirm
	confirm_purchase_finance: MockConfirmClass,
	on_confirm_purchase_finance: MockOnConfirmClass,

	// // status / on_status
	status_purchase_finance: MockStatusClass,
	on_status_purchase_finance: MockOnStatusClass,
	on_status_purchase_finance1: MockOnStatusClass,
	on_status_purchase_finance2: MockOnStatusClass,
	on_status_unsolicited: MockOnStatusUnsolicitedClass,

	// // update / on_update
	update_purchase_finance: MockUpdateClass,
	update_missed_Emi: MockUpdateMissedEmiClass,
	update_foreclosure: MockUpdateForeclosureClass,
	update_prepart: MockUpdatePrepartClass,
	on_update_purchase_finance: MockOnUpdateClass,
	on_update_missed_Emi: MockOnUpdateMissedEmiClass,
	on_update_foreclosure: MockOnUpdateForeclosureClass,
	on_update_prepart: MockOnUpdatePrepartClass,
	on_update1_unsolicited_purchase_finance: MockOnUpdateUnsolicitedClass,
	on_update_unsolicited_cancel: MockOnUpdateUnsolicitedCancelClass,
	on_update_unsolicited_missed_Emi: MockOnUpdateUnsolicitedMissedEmiClass,
	on_update_unsolicited_foreclosure: MockOnUpdateUnsolicitedForeclosureClass,
	on_update_unsolicited_prepart: MockOnUpdateUnsolicitedPrepartClass,


	// // cancel / on_cancel
	soft_cancel_purchase_finance: MockSoftCancelClass,
	soft_on_cancel_purchase_finance: MockSoftOnCancelClass,
	confirmed_cancel_purchase_finance: MockConfirmedCancelClass,
	confirmed_on_cancel_purchase_finance: MockConfirmedOnCancelClass,

} as const satisfies Record<string, Ctor<MockAction>>;

type MockActionId = keyof typeof registry;

// Construct by id
export function getMockAction(actionId: string): MockAction {
	console.log('actionId==>>>>>>>>>>>>>>>>', actionId)
	const Ctor = registry[actionId as MockActionId];
	if (!Ctor) {
		throw new Error(`Action with ID ${actionId as string} not found`);
	}
	return new Ctor();
}

// List all possible ids — stays in sync automatically
export function listMockActions(): MockActionId[] {
	return Object.keys(registry) as MockActionId[];
}
