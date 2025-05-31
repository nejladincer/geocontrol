import { getAllUsers, getUser, createUser, deleteUser } from "@controllers/userController";
import { UserRepository } from "@repositories/UserRepository";
import { UserType } from "@models/UserType";
import { User as UserDTO } from "@dto/User";
import { UserDAO } from "@models/dao/UserDAO";

jest.mock("@repositories/UserRepository");
jest.mock("@services/mappings/userMapperService", () => ({
  mapUserDAOToDTO: jest.fn((user) => ({
    username: user.username,
    type: user.type
  }))
}));

describe("UserController", () => {
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepo = new UserRepository() as jest.Mocked<UserRepository>;
    (UserRepository as jest.Mock).mockImplementation(() => mockUserRepo);
  });

  describe("getAllUsers", () => {
    it("should return all users mapped to DTOs", async () => {
      const mockUsers: UserDAO[] = [
        { username: "user1", type: UserType.Admin, password: "pass1" },
        { username: "user2", type: UserType.Operator, password: "pass2" }
      ];
      mockUserRepo.getAllUsers.mockResolvedValue(mockUsers);

      const result = await getAllUsers();

      expect(mockUserRepo.getAllUsers).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ username: "user1", type: UserType.Admin });
      expect(result[1]).toEqual({ username: "user2", type: UserType.Operator });
    });
  });

  describe("getUser", () => {
    it("should return user mapped to DTO", async () => {
      const mockUser: UserDAO = { 
        username: "testuser", 
        type: UserType.Operator,
        password: "testpass"
      };
      mockUserRepo.getUserByUsername.mockResolvedValue(mockUser);

      const result = await getUser("testuser");

      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledWith("testuser");
      expect(result).toEqual({ username: "testuser", type: UserType.Operator });
    });
  });

  describe("createUser", () => {
    it("should create a new user", async () => {
      const userDto: UserDTO = {
        username: "newuser",
        password: "password123",
        type: UserType.Operator
      };

      await createUser(userDto);

      expect(mockUserRepo.createUser).toHaveBeenCalledWith(
        "newuser",
        "password123",
        UserType.Operator
      );
    });
  });

  describe("deleteUser", () => {
    it("should delete a user", async () => {
      await deleteUser("testuser");

      expect(mockUserRepo.deleteUser).toHaveBeenCalledWith("testuser");
    });
  });
}); 