import { Appointment } from "../domain/entities/Appointment";
import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import {PublishCommand, SNSClient} from '@aws-sdk/client-sns';
import { v4 as uuidv4 } from "uuid";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";

const snsclient = new SNSClient({});

export class AppointmentService {

    constructor(private client?: DynamoDBClient){
        this.client = client || new DynamoDBClient({});
    }
    
    async createAppointment(data){
        console.log("Inicia petición de tipo Post")
        if(!data.body){
            return {
            statusCode: 400,
            body: JSON.stringify({ code: '0002', message: 'Debe enviar la información de la cita' }),
            };
        }

        const body = JSON.parse(data.body);
        const appointment = plainToClass(Appointment, body);
        const id = uuidv4();
        appointment.appointmentId = id;
        console.log('Appointment recibido:', appointment);

        const errors = await validate(appointment);
        if(errors.length>0){
            return {
          statusCode: 400,
          body: JSON.stringify({ code: '0001',message: 'Datos inválidos',
            errors: errors.map(e=> ({
                field: e.property,
                constraints: e.constraints
            }))
          })}
        }

        await this.client.send(new PutItemCommand({
        TableName: "AppointmentsTable",
            Item: {
                appointment_id: {S: id},
                insured_id: {S: appointment.insuredId},
                schedule_id: {N: String(appointment.scheduleId)},
                country_iso: {S: appointment.countryISO},
                estado: {S: "pending"}
            },
        })) 

        await snsclient.send(new PublishCommand({
            TopicArn: process.env.SNS_TOPIC!,
            Message: JSON.stringify(appointment),
            MessageAttributes:{
                "route":{
                DataType: "String",
                StringValue: appointment.countryISO
            }
            }
        }));
        
        return {
          statusCode: 200,
          body: JSON.stringify({ code: '0000',message: 'Cita creada correctamente'}),
        };
    }

    async getAppointments(insuredId){
        console.log("Inicia petición de tipo Get " + insuredId)
        const result = await this.client.send(
            new QueryCommand({
                TableName: "AppointmentsTable",
                IndexName: "InsuredIdIndex",
                KeyConditionExpression: "insured_id = :insuredId",
                ExpressionAttributeValues:{
                    ":insuredId": {S: insuredId}
                }
            })
        )

        const items = result.Items?.map((item)=> unmarshall(item)) || [];
        const appointments = items.map((data)=> Object.assign(new Appointment(), data));

        return {
          statusCode: 200,
          body: JSON.stringify({ code: '0000',message: "Todas las operaciones se efectuaron correctamente" ,
            data: appointments}),
        };;
    }

    async updateAppointment(appointment){
        
        return this.client.send(new UpdateItemCommand(
        {
            TableName: "AppointmentsTable",
            Key: {
            appointment_id: {S: appointment.appointmentId}
            },
            UpdateExpression: "SET estado = :estado",
            ExpressionAttributeValues:{
                ":estado": { S: "completed"}
            }
        }
        ))
    }
}