const bcrypt = require("bcryptjs");

const Hashing = {
  Hash: async (TextToHash, rounds) => {
    try {
      const hash = await bcrypt.hash(TextToHash, rounds);
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
