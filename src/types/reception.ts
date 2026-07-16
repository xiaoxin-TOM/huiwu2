export type ReceptionInfo = {
  id: string;
  arriveMode: string;
  arriveNo: string;
  arriveTime: string;
  arrivePlace: string;
  departMode: string;
  departNo: string;
  departTime: string;
  hotelName: string;
  hotelRoom: string;
  hotelCheckIn: string;
  hotelCheckOut: string;
  carPlate: string;
  carDriver: string;
  carDriverPhone: string;
  carContact: string;
  remark: string;
};

export type ReceptionRow = {
  id: string;
  kind: "guest" | "registration";
  name: string;
  company: string;
  category: string;
  contact: string;
  phone: string | null;
  email: string | null;
  reception: ReceptionInfo | null;
};
