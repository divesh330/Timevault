import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

const Browse = () => {
  const [watches, setWatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWatches = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "watches"));
        const watchList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setWatches(watchList);
      } catch (error) {
        console.error("Error fetching watches:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWatches();
  }, []);

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-400 animate-pulse">
        Loading marketplace watches...
      </p>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-gold">
        Explore the Marketplace
      </h1>

      {watches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {watches.map((watch) => (
            <div
              key={watch.id}
              className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 border border-gold"
            >
              <img
                src={
                  watch.imageUrl ||
                  "https://via.placeholder.com/400x400?text=No+Image"
                }
                alt={watch.title || "Watch"}
                className="w-full h-64 object-cover"
              />
              <div className="p-5">
                <h2 className="text-xl font-semibold text-gold mb-1">
                  {watch.title || "Untitled Watch"}
                </h2>
                <p className="text-gray-400 mb-2">{watch.brand || "Unknown Brand"}</p>
                <p className="font-bold text-white">RM {watch.price || "N/A"}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-20">
          No watches available in the marketplace yet.
        </p>
      )}
    </div>
  );
};

export default Browse;
