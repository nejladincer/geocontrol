import { getToken } from "@controllers/authController";
import { UserRepository } from "@repositories/UserRepository";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { UserType } from "@models/UserType";

jest.mock("@repositories/UserRepository");

describe("getToken", () => {
  const mockUserRepo = UserRepository as jest.MockedClass<typeof UserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a valid token when credentials are correct", async () => {
    const userDto = { username: "testuser", password: "testpass", type: UserType.Admin };

    mockUserRepo.prototype.getUserByUsername.mockResolvedValue({
      username: "testuser",
      password: "testpass",
      type: UserType.Admin,
    });

    const tokenDto = await getToken(userDto);

    expect(tokenDto).toHaveProperty("token");
    expect(typeof tokenDto.token).toBe("string");
  });

  it("should throw UnauthorizedError when password is incorrect", async () => {
    const userDto = { username: "testuser", password: "wrongpass", type: UserType.Admin };

    mockUserRepo.prototype.getUserByUsername.mockResolvedValue({
      username: "testuser",
      password: "correctpass",
      type: UserType.Admin,
    });

    await expect(getToken(userDto)).rejects.toThrow(UnauthorizedError);
    await expect(getToken(userDto)).rejects.toThrow("Invalid password");
  });
});