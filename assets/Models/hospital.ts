export class Hospital{
    HopsitalID: number;
    name: string;
    phone_number: string;
    switchboard: number;
    address: string;
    pictureRef: string;
    lat: number;
    long: number;
    icus: ICU[];
    instNum: number;
    hospCode: number;
    hospCIHIcode: number;
    province: string;
    municipality: string;
    regionName: string;
    institutionName: string;
    siteName: string;
    peerGroupCIHI: string;
    contact: Person;
    urlIdentifier: string;
    website: string;
    city: string;
    country: string;
    postalCode: string;
}
export class ICU{
    ICUID: number;
    name: string;
    urlIdentifier: string;
    phone_number: string;
    HospitalID: number;
    siteName: string;
    ICUType: string;
    ICULevel: number;
    comments: string;
    adminContact: Person;
    medContact: Person;
    AdultICUBeds: number;
    PedICUBeds: number;
    invasiveVentrilationBeds: number;
    staff: Person[];
}
export class Person{
    PersonID: number;
    doNotContact: Boolean;
    emailVerificationStatus: string;//bounced, None, Valid, Verified, Verified_RC2017
    prefix: string; //dr, mr, mrs, ms
    firstName: string;
    lastName: string;
    middleName: string;
    roles:Role[];
    university: string;
    CCM_Cert: boolean;
    pediatric: boolean;
    mailAddress1: string;
    mailAddress2: string;
    city: string;
    province: string;
    country:string;
    postal_code: string;
    email:string;
    email2: string;
    admin: Person;
    phone1: string;
    phone2: string;
    DateCreated: Date;
    permissionCCCTG: boolean;
    permissionCBS: boolean;
    permissionCCCS: boolean;
    membershipType: string; //Active, ActiveMember, Affiliate, Affiliate Member, Associate Member, Intensive Affiliate Member, Non Intensive Associate Member
    notes: string;
    specialties: string[];
}
export class Role{
    personID: number;
    role: string;
    ICUID: number;
}