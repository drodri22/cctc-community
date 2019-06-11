export class Hospital{
    HopsitalID: number;
    name: string;
    phone_number: string;
    address: string;
    pictureRef: string;
    lat: number;
    lng: number;
    ICUs: ICU[];
    instNum: number;
    hospCode: number;
    hospCIHIcode: string;
    province: string;
    municipality: string;
    regionName: string;
    siteName: string;
    peerGroupCIHI: string;
    contact: Person;
    urlIdentifier: string;
    website: string;
    city: string;
    country: string;
    postalCode: string;
    switchboard: string;
    comments:string;
}
export class ICU{
    ICUID: number;
    name: string;
    urlIdentifier: string;
    phone_number: string;
    switchboard: string;
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
    peerGroupCIHI: string;
    INSTNUM: number;
    HospCode: number;
    HospCIHIcode: string; 
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
    localVerification: boolean = false;
    rolesToAdd: Role [];//for revision
    rolesToRemove: Role [];//for revision
}
export class Role{
    RoleID: number;
    PersonID: number;
    role: string;
    ICUID: number;
}
export class Revision{
    RevisionID: number;
    dateCreated: Date;
    newVersion: Person;
    oldVersion: Person;
    reviewed: boolean;
    
}