require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MonadDraw API listening on port ${PORT}`);
});
