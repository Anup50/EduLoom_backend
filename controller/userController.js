const User=require("../model/User");

const getAll= async (req,res)=>{
    try{
        const users= await User.find();
        res.status(200).json(users);
    }catch(e){
        res.status(500).json({ message: error.message });
    }
};

const getById= async (req,res)=>{
    try {
        const u = await User.findById(req.params.id);
        if (u == null) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(u);
    }catch(e){
        res.status(500).json({ message: e.message });
    }
};

const create = async (req, res) => {
    console.log("Request Body:", req.body);
    try {
        const { name, email, password, role } = req.body;
        const u = new User({name, email, password, role});

        await u.save();
        console.log("User Saved:", u);

        res.status(201).json(u);
    } catch (error) {
        console.error("Error saving User:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Emailalready exists" });
        }
        res.status(400).json({ message: error.message });
    }
};

// Update method
const update = async (req, res) => {
    try{
        const u = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }); 
        if(!u){
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(u);
    }catch(error){
        res.status(500).json({ message: error.message });
    }
};

// Delete method
const deleteById = async (req, res) => {
    try{
        const u = await User.findByIdAndDelete(req.params.id);
        if(!u){
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    }catch(error){
        res.status(500).json({ message: error.message });
    }
};




module.exports = {
    getAll,
    create,
    getById,
    update,
    deleteById };