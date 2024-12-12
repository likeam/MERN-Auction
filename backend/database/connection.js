import mongoose from "mongoose";

export const connection = () => {
  mongoose
    .connect(process.env.MONGO_URL, {
      dbName: "MERN_AUCTION",
    })
    .then(() => {
      console.log("Connected to DataBase");
    })
    .catch((err) => {
      console.log(`Some Error Occured While Connecting to DataBase : ${err}`);
    });
};
