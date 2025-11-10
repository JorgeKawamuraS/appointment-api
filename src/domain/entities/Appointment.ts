import { IsIn, IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class Appointment{
    appointmentId: string;
    
    @IsString()
    @IsNotEmpty({ message: "El campo no debe ser nulo ni vacío" })
    insuredId: string;
    
    @IsInt()
    @IsNotEmpty({ message: "El campo no debe ser nulo ni vacío" })
    @Min(1, { message: "scheduleId debe ser mayor a 0" })
    scheduleId: number;

    @IsString()
    @IsNotEmpty({ message: "El campo no debe ser nulo ni vacío" })
    @IsIn(["PE", "CL"], { message: "countryISO solo puede ser 'PE' o 'CL'" })
    countryISO: string;
}