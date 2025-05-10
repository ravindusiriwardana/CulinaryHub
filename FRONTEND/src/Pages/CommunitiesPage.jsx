import { useState, useEffect } from "react";
import { useAuth } from "../context/auth/useAuth";
import {
  getAllCommunities,
  getPublicCommunities,
  getCommunitiesByMember
} from "../api/communityAPI";
import { Plus, Filter, Search } from "lucide-react";
import CommunityCard from "../components/CommunityCard";
import CreateCommunityModal from "../components/CreateCommunityModal";
import toast from "react-hot-toast";

const CommunitiesPage = () => {
  const { currentUser } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState("all"); // all, my, public
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    fetchCommunities();
  }, [filter, currentUser]);

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      let response;

      switch (filter) {
        case "my":
          if (!currentUser) {
            setCommunities([]);
            setLoading(false);
            return;
          }
          response = await getCommunitiesByMember(currentUser.id, currentUser.token);
          break;
        case "public":
          response = await getPublicCommunities(currentUser?.token);
          break;
        default:
          response = await getAllCommunities(currentUser?.token);
          break;
      }

      setCommunities(response.data);
    } catch (error) {
      console.error("Error fetching communities:", error);
      toast.error("Failed to load communities");
    } finally {
      setLoading(false);
    }
  };

  const handleCommunityCreated = () => {
    setShowCreateModal(false);
    fetchCommunities();
    toast.success("Community created successfully!");
  };

  const handleJoin = (_communityId) => {
    // Refresh communities after a user joins
    fetchCommunities();
    // No need for toast here as it's already shown in the CommunityCard component
  };

  const handleLeave = (_communityId) => {
    // Refresh communities after a user leaves
    fetchCommunities();
    // No need for toast here as it's already shown in the CommunityCard component
  };

  const filteredCommunities = communities
    .filter(community =>
      community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(community =>
      category ? community.category === category : true
    );

  const categories = [
    "Programming",
    "Data Science",
    "Web Development",
    "Mobile Development",
    "DevOps",
    "AI/ML",
    "Cybersecurity",
    "Other"
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Communities</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Join communities to connect with other learners
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-1" />
          Create Community
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search communities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>


          <div className="flex flex-col md:flex-row gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 border rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <div className="flex">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-l-md ${
                  filter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("my")}
                className={`px-4 py-2 ${
                  filter === "my"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                My Communities
              </button>
              <button
                onClick={() => setFilter("public")}
                className={`px-4 py-2 rounded-r-md ${
                  filter === "public"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }`}
                //  //
                //new buuton
              >
                Public
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredCommunities.length > 0 ? (
        <div className="flex flex-col space-y-4">
          {filteredCommunities.map(community => (
            <CommunityCard
              key={community.id}
              community={community}
              currentUser={currentUser}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onUpdate={fetchCommunities}
              joinButtonColor="green"
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No communities found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === "my"
              ? "You haven't joined any communities yet."
              : "No communities match your search criteria."}
          </p>
          {filter === "my" && (
            <button
              onClick={() => setFilter("all")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Explore Communities
            </button>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateCommunityModal
          onClose={() => setShowCreateModal(false)}
          onCommunityCreated={handleCommunityCreated}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
// CommunitiesPage component
// This component fetches and displays a list of communities.
// It allows users to create new communities, search for existing ones,

export default CommunitiesPage;