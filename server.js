require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB successfully");
    })
    .catch((err) => {
        console.log("MongoDB error:", err.message);
    });

// Member Schema
const memberSchema = new mongoose.Schema({
    memberId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    clubName: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        required: true
    },
    interests: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        required: true
    }
});

// Model
const Member = mongoose.model("Member", memberSchema);

// Home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index1.html"));
});

// 1. Add Member
app.post("/add-member", async (req, res) => {
    try {
        const member = new Member({
            memberId: req.body.memberId,
            name: req.body.name,
            clubName: req.body.clubName,
            year: Number(req.body.year),
            role: req.body.role,
            points: Number(req.body.points),
            interests: req.body.interests
                ? req.body.interests.split(",").map(item => item.trim())
                : [],
            status: req.body.status
        });

        await member.save();

        res.send(`
            <h2>Member added successfully!</h2>
            <a href="/">Go Back</a>
        `);

    } catch (err) {
        res.send("Error: " + err.message);
    }
});

// 2. Display members of a club with points greater than given value
app.get("/club-members", async (req, res) => {
    try {
        const members = await Member.find({
            clubName: req.query.clubName,
            points: { $gt: Number(req.query.points) }
        });

        res.json(members);

    } catch (err) {
        res.send("Error: " + err.message);
    }
});

// 3. Search member by Member ID
app.get("/search-member", async (req, res) => {
    try {
        const member = await Member.findOne({
            memberId: req.query.memberId
        }).select("name clubName role points -_id");

        res.json(
            member || { message: "Member not found" }
        );

    } catch (err) {
        res.send("Error: " + err.message);
    }
});

// 4. Update role and points
app.post("/update-member", async (req, res) => {
    try {
        const member = await Member.findOneAndUpdate(
            { memberId: req.body.memberId },
            {
                role: req.body.role,
                points: Number(req.body.points)
            },
            { new: true }
        );

        res.send(
            member
                ? "Member updated successfully!"
                : "Member not found"
        );

    } catch (err) {
        res.send("Error: " + err.message);
    }
});

// 5. Increase points for all members in a club
app.post("/increase-points", async (req, res) => {
    try {
        const result = await Member.updateMany(
            { clubName: req.body.clubName },
            {
                $inc: {
                    points: Number(req.body.points)
                }
            }
        );

        res.send(
            result.modifiedCount +
            " members updated successfully!"
        );

    } catch (err) {
        res.send("Error: " + err.message);
    }
});

// 6. Search members within points range
app.get("/points-range", async (req, res) => {
    try {
        const members = await Member.find({
            points: {
                $gte: Number(req.query.min),
                $lte: Number(req.query.max)
            }
        });

        res.json(members);

    } catch (err) {
        res.send("Error: " + err.message);
    }
});

// 7. Delete member by Member ID
app.post("/delete-member", async (req, res) => {
    try {
        const member = await Member.findOneAndDelete({
            memberId: req.body.memberId
        });

        res.send(
            member
                ? "Member deleted successfully!"
                : "Member not found"
        );

    } catch (err) {
        res.send("Error: " + err.message);
    }
});

// 8. Display all members in descending order of points
app.get("/all-members", async (req, res) => {
    try {
        const members = await Member.find()
            .sort({ points: -1 });

        res.json(members);

    } catch (err) {
        res.send("Error: " + err.message);
    }
});

// Port
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});