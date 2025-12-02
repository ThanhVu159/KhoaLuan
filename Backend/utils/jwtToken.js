export const generateToken = (user, message, statusCode, res) => {
  const token = user.generateJsonWebToken();
  console.log("🔐 Token tạo ra:", token); // kiểm tra giá trị thực tế

  const cookieName = user.role === "Admin" ? "adminToken" : "patientToken";

  res
    .status(statusCode)
    .cookie(cookieName, token, {
      expires: new Date(
        Date.now() + Number(process.env.COOKIE_EXPIRE) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    .json({
      success: true,
      message,
      user,
      token,
    });
};