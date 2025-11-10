import { Appointment } from "../../domain/entities/Appointment";
import { SQSEvent } from "aws-lambda";
import { getConnection } from "../../infrastructure/database/mysql";
import * as AWS from "aws-sdk";

const eventBridge = new AWS.EventBridge();

export const handler = async (event: SQSEvent) => {
    console.log("Evento recibido en lambda appointment_cl")
    console.log(event)
    if(event.Records[0].body){
        const sqsMessage = JSON.parse(event.Records[0].body);
        const appointment = JSON.parse(sqsMessage.Message) as Appointment;

        const connection = await getConnection(process.env.DB_CL);

        try{
            console.log("Guardando appointment con id "+ appointment.appointmentId)
            await connection.query("INSERT INTO appointments (appointment_id,insured_id, schedule_id , country_iso) VALUES(?,?,?,?)",
                [appointment.appointmentId,appointment.insuredId, appointment.scheduleId, appointment.countryISO]
            )
        }catch(error){
            console.log("Error al hacer insert en la bd " + process.env.DB_CL);
            console.log(error.message)
            return;
        }        
        console.log("El appointment con id " + appointment.insuredId +" llegó a appointment_cl")
    
        await eventBridge.putEvents({
            Entries: [
                {
                    Source: "appointment.cl",
                    DetailType: "ClEvent",
                    Detail: JSON.stringify(appointment),
                    EventBusName: "AppointmentBus"
                }
            ]
        }).promise();
    }
};