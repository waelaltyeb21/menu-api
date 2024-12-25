const bcrypt = require("bcryptjs");

const Hashing = {
  Hash: async (TextToHash, rounds) => {
    try {
      console.log("TextToHash:", TextToHash, "Rounds:", rounds);
      const hash = await bcrypt.hash(TextToHash, rounds);
      console.log(hash);
      return hash;
    } catch (error) {
      return error;
    }
  },
  Compare: async (payload, HashedData) => {
    try {
      const Compare = await bcrypt.compare(payload, HashedData);
      return Compare;
    } catch (error) {
      return error;
    }
  },
};
module.exports = Hashing;
