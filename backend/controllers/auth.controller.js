import bcrypt from "bcryptjs";
import User from "./../models/user.model.js";
import generateTokenAndSetCookie from "./../utils/generateToken.js";

export const signup = async (req, res) => {
  try {
    const { fullname, username, password, confirmPassword, gender } = req.body;

    if (password !== confirmPassword)
      return res.status(400).json({ error: "password don't match" });

    const user = await User.findOne({ username });
    if (user)
      return res.status(400).json({ error: "this username already in use" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
    const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;

    const newUser = new User({
      fullname,
      username,
      password: hashedPassword,
      gender,
      profilePicture: gender == "male" ? boyProfilePic : girlProfilePic,
    });
    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);
      await newUser.save();
      return res.status(201).json({
        _id: newUser._id,
        fullname: newUser.fullname,
        username: newUser.username,
        profilePicture: newUser.profilePicture,
      });
    } else {
      return res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller -", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    );

    if (!user || !isPasswordCorrect)
      return res.status(400).json({ error: "Invalid username of password" });

    generateTokenAndSetCookie(user._id, res);
    return res.status(200).json({
      _id: user._id,
      fullname: user.fullname,
      username: user.username,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.log("Error in login controller -", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    return res.status(200).json({ message: "logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller -", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const update = async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0)
      return res.status(400).json({ error: "No feild to update" });

    const { fullname, username, password, confirmPassword, gender } = req.body;

    if (username !== req.user.username) {
      const user = await User.findOne({ username });
      if (user)
        return res.status(400).json({ error: "this username already in use" });
    }

    if (password?.length < 6)
      return res
        .status(400)
        .json({ error: "password must have 6+ characters" });

    if (password && password !== confirmPassword)
      return res.status(400).json({ error: "password don't match" });

    const update = {
      username,
      fullname,
      gender,
    };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      let hashedPassword = await bcrypt.hash(password, salt);
      update.password = hashedPassword;
    }

    const result = await User.updateOne({ _id: req.user._id }, update);

    const newUser = await User.findOne({ username });
    generateTokenAndSetCookie(newUser._id, res);

    return res.status(201).json({
      _id: newUser._id,
      fullname: newUser.fullname,
      username: newUser.username,
      profilePicture: newUser.profilePicture,
    });
  } catch (error) {
    console.log("Error in updaate controller -", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
