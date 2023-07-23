const express = require("express");
const app = express();
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const filePath = "./dev-data/data/users.json";
const users = JSON.parse(fs.readFileSync(filePath));

app.use(express.json());

// Response Handler Functions
const getAllUsers = (request, response) => {
  response.status(200).json({
    status: "success",
    total: users.length,
    data: {
      users,
    },
  });
};

const signUpUser = async (request, response) => {
  const id = uuidv4();
  const textPassword = request.body.password;
  // Hashing user's password
  try {
    const hashedPassword = await bcrypt.hash(textPassword, 10);
    const newUser = Object.assign(
      { _id: id },
      {
        name: request.body.name,
        email: request.body.email,
        role: request.body.role,
        active: request.body.active,
        photo: request.body.photo,
        password: hashedPassword,
      }
    );
    users.push(newUser);
    fs.writeFile(filePath, JSON.stringify(users), (err) => {
      response.status(201).json({
        status: "success",
        data: {
          user: newUser,
        },
      });
    });
  } catch (err) {
    response.status(500).json({
      status: "fail",
      message: "Internal Server Error",
    });
  }
};

const loginUser = async (request, response) => {
  const { email, password } = request.body;
  const user = users.find((user) => user.email === email);
  if (!user) {
    response.status(400).json({
      status: "fail",
      message: "Bad request, user is not found",
    });
  } else {
    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        response.status(200).json({
          status: "success",
          message: "Sign-in successful",
          data: {
            user,
          },
        });
      } else {
        response.status(401).json({
          status: "fail",
          message: "Unauthorized, Password is not correct",
        });
      }
    } catch (err) {
      response.status(500).json({
        status: "fail",
        message: "Internal Server Error",
      });
    }
  }
};

const updateUserInfo = async (request, response) => {
  const { email, password } = request.body;
  const userToUpdate = users.find((user) => user.email === email);
  if (!userToUpdate) {
    response.status(400).json({
      status: "fail",
      message: "User is not found",
    });
  } else {
    const isPasswordValid = await bcrypt.compare(
      password,
      userToUpdate.password
    );
    if (isPasswordValid) {
      const updatedUser = Object.assign(userToUpdate, request.body, {
        password: userToUpdate.password,
      });
      const index = users.indexOf(userToUpdate);
      users[index] = updatedUser;
      fs.writeFile(filePath, JSON.stringify(users), (err) => {
        if (err) {
          console.log("Error while writing updated data ", err);
        } else {
          return response.status(200).json({
            status: "success",
            data: {
              user: updatedUser,
            },
          });
        }
      });
    } else {
      response.status(401).json({
        status: "fail",
        message: "Password is not correct",
      });
    }
  }
};

const deleteUser = async (request, response) => {
  const { email, password } = request.body;
  const userToDelete = users.find((user) => user.email === email);
  if (!userToDelete) {
    response.status(400).json({
      status: "fail",
      message: "Bad Request, User is not found",
    });
  } else {
    const isPasswordValid = await bcrypt.compare(
      password,
      userToDelete.password
    );

    if (isPasswordValid) {
      const index = users.indexOf(userToDelete);
      users.splice(index, 1);
      try {
        fs.writeFile(
          "./dev-data/data/users.json",
          JSON.stringify(users),
          (err) => {
            if (err) {
              console.log("Error while writing users in file");
            } else {
              response.status(204).json({
                status: "success",
                data: null,
              });
            }
          }
        );
      } catch (err) {
        console.log(err);
      }
    } else {
      response.status(401).json({
        status: "fail",
        message: "Unauthorized, Password is not correct",
      });
    }
  }
};

app.route("/api/v1/users").get(getAllUsers).patch(updateUserInfo);

app.post("/api/v1/users/signup", signUpUser);

app.post("/api/v1/users/login", loginUser);

app.delete("/api/v1/users/delete", deleteUser);

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
