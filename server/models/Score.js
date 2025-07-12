const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },

    score: { type: Number, default: 0 },

    entries: [
      {
        date: { type: String, required: true }, // e.g., "2025-06-26"
        status: { type: String, enum: ['short', 'excess', 'holiday'], required: true },
        rupees: { type: Number, default: 0 }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Score', ScoreSchema);
