const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const axios = require("axios");
const jwt = require("jwt-simple");
const bcrypt = require("bcryptjs");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "inventally";
const MONGOOSE_URI_STRING = process.env.MONGOOSE_URI_STRING || "mongodb://localhost:27017/watch2win";
const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:8000/api/v1";

app.use(cors());
app.use(express.json());

const buildSwaggerSpec = req => {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = forwardedProto
    ? forwardedProto.split(",")[0].trim()
    : req.protocol;
  const host = req.get("host");

  return {
    ...swaggerSpec,
    servers: [
      {
        url: `${protocol}://${host}`,
        description: "Current request host"
      }
    ]
  };
};

mongoose.connect(MONGOOSE_URI_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    userName: String,
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    password: String,
    active: {
      type: Boolean,
      default: true,
    },
    roles: [String],
    image: String,
    code: String,
  },
  {
    collection: "users",
    strict: false,
  }
);

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.models.user || mongoose.model("user", userSchema);

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    userName: user.userName,
    email: user.email,
    roles: user.roles,
    image: user.image,
    code: user.code,
  };
}

function issueToken(user) {
  return `JWT ${jwt.encode(
    {
      _id: user._id,
      email: user.email,
      roles: user.roles,
    },
    JWT_SECRET
  )}`;
}

async function authenticateRequest(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("JWT ")) {
    return res.status(401).json({
      success: false,
      message: "Not Authorized",
    });
  }

  try {
    const decoded = jwt.decode(authHeader.slice(4), JWT_SECRET);
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not Authorized",
    });
  }
}

app.get("/", (req, res) => {
  res.send("Hello from auth!");
});

app.get("/api-docs.json", (req, res) => {
  res.json(buildSwaggerSpec(req));
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  (req, res, next) => {
    swaggerUi.setup(buildSwaggerSpec(req), {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true
      }
    })(req, res, next);
  }
);

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(200).json({
      success: false,
      errors: {
        email: {
          message: "Email and password is required",
        },
      },
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase(), active: true });

    if (!user) {
      return res.status(200).json({
        success: false,
        errors: {
          email: {
            message: "Email does not exist",
          },
        },
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(200).json({
        success: false,
        errors: {
          email: {
            message: "Password did not match",
          },
        },
      });
    }

    return res.json({
      success: true,
      data: {
        user: sanitizeUser(user),
        token: issueToken(user),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to authenticate user",
    });
  }
});

app.post("/signup", async (req, res) => {
  try {
    const response = await axios.post(`${BACKEND_API_URL}/signup`, req.body);
    return res.status(response.status).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create user",
    });
  }
});

app.get("/me", authenticateRequest, async (req, res) => {
  return res.json({
    success: true,
    data: {
      user: sanitizeUser(req.user),
    },
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Auth service running on port ${PORT}`);
});
