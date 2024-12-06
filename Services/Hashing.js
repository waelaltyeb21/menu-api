const bcrypt = require("bcryptjs");
const Hashing = {
  hashText: async (saltRounds = 20, text) => {
    try {
      const hashing = bcrypt.hashSync(text, 20);
      console.log(hashing);
      return hashing;
    } catch (error) {
      return error;
    }
  },
  deHashText: async (payload, HashedData) => {
    try {
      const Compare = await bcrypt.compare(payload, HashedData);
      console.log(Compare);
      return Compare;
    } catch (error) {
      return error;
    }
  },
};
module.exports = Hashing;
