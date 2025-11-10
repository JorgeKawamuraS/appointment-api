import { AppointmentService } from "../src/application/AppointmentService";
import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";

jest.mock("@aws-sdk/util-dynamodb", () => ({
  unmarshall: jest.fn((item) => item),
}));

describe("AppointmentService.getAppointments", () => {
  let service: AppointmentService;
  let mockSend: jest.Mock;

  beforeEach(() => {
    mockSend = jest.fn();
    const mockClient = { send: mockSend } as any;

    service = new AppointmentService(mockClient);
  });

  it("debe retornar lista de citas correctamente", async () => {
    mockSend.mockResolvedValue({
      Items: [
        {
          appointmentId: "1",
          insuredId: "123",
          scheduleId: 10,
          countryISO: "PE",
        },
      ],
    });

    const response = await service.getAppointments("123");
    const body = JSON.parse(response.body);

    expect(mockSend).toHaveBeenCalled();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].insuredId).toBe("123");
    expect(body.data[0].countryISO).toBe("PE");
  });

  it("debe retornar array vacío si no hay items", async () => {
    mockSend.mockResolvedValue({ Items: [] });

    const response = await service.getAppointments("456");
    const body = JSON.parse(response.body);

    expect(mockSend).toHaveBeenCalled();
    expect(body.data).toEqual([]);
  });
});

describe("AppointmentService.updateAppointment", () => {
  let service: AppointmentService;
  let mockSend: jest.Mock;

  beforeEach(() => {
    mockSend = jest.fn();
    const mockClient = { send: mockSend } as any;
    service = new AppointmentService(mockClient);
  });

  it("debe llamar a DynamoDB con UpdateItemCommand", async () => {
    mockSend.mockResolvedValue({
      Attributes: {
        appointment_id: { S: "1" },
        estado: { S: "completed" },
      },
    });

    const appointment = { appointmentId: "1" };
    const response = await service.updateAppointment(appointment);

    expect(mockSend).toHaveBeenCalledWith(expect.any(UpdateItemCommand));

    expect(response.Attributes?.appointment_id.S).toBe("1");
    expect(response.Attributes?.estado.S).toBe("completed");
  });
});
