import { Appointment } from "../../domain/entities/Appointment";
import { AppointmentService } from "../../application/AppointmentService";
import * as dotenv from "dotenv";

dotenv.config();

export const handler = async (event: any) => {
  console.log(event)
  const appointmentService = new AppointmentService();
  if('httpMethod' in event){
    console.log("Petición por Api Gateway")


    switch (event.httpMethod){
      case "GET":
        const params = event.pathParameters || {};
        return await appointmentService.getAppointments(params.insuredId);
      case "POST":
        return await appointmentService.createAppointment(event);
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ mensaje: 'Método no permitido' }),
        };
    }

  }

  if('Records' in event){
    const sqsMessage = JSON.parse(event.Records[0].body);
    const appointment = sqsMessage.detail as Appointment;
    console.log("Cita creada correctamente")
    if(appointment.appointmentId){
      await appointmentService.updateAppointment(appointment);
    }
  }
};