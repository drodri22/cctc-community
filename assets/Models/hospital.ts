export class Hospital{
    HopsitalID: number;
    name: string;
    phone_number: string;
    address: string;
    pictureRef: string;
    lat: number;
    long: number;
    icus: ICU[];
}
export class ICU{
    ICUID: number;
    name: string;
    phone_number: string;
    HospitalID: number;
}