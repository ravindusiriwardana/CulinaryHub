import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth/useAuth";
import {
  getCommunityById,
  joinCommunity,
  leaveCommunity,
  addAdmin,
  removeAdmin,
  deleteCommunity,
  isMember,
  isAdmin,
  isCreator
} from "../api/communityAPI";
import {
  Users,
  UserPlus,
  UserMinus,
  Shield,
  ShieldOff,
  Trash2,
  Edit,
  Calendar,
  Lock,
  Unlock
} from "lucide-react";
import toast from "react-hot-toast";
import EditCommunityModal from "../components/EditCommunityModal";

const CommunityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState({
    isMember: false,
    isAdmin: false,
    isCreator: false
  });
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchCommunityDetails();
  }, [id, currentUser]);

  const fetchCommunityDetails = async () => {
    setLoading(true);
    try {
      const response = await getCommunityById(id, currentUser?.token);
      setCommunity(response.data);

      if (currentUser) {
        const [memberResp, adminResp, creatorResp] = await Promise.all([
          isMember(id, currentUser.id, currentUser.token),
          isAdmin(id, currentUser.id, currentUser.token),
          isCreator(id, currentUser.id, currentUser.token)
        ]);

        setUserStatus({
          isMember: memberResp.data,
          isAdmin: adminResp.data,
          isCreator: creatorResp.data
        });
      }
    } catch (error) {
      console.error("Error fetching community details:", error);
      toast.error("Failed to load community details");
      navigate("/communities");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!currentUser) {
      toast.error("Please log in to join this community");
      return;
    }

    try {
      await joinCommunity(id, currentUser.id, currentUser.token);
      toast.success(`You've joined ${community.name}`);
      fetchCommunityDetails();
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community");
    }
  };

  const handleLeave = async () => {
    if (!currentUser) return;

    try {
      await leaveCommunity(id, currentUser.id, currentUser.token);
      toast.success(`You've left ${community.name}`);
      fetchCommunityDetails();
    } catch (error) {
      console.error("Error leaving community:", error);
      toast.error("Failed to leave community");
    }
  };

  const handleAddAdmin = async (userId) => {
    try {
      await addAdmin(id, userId, currentUser.token);
      toast.success("Admin added successfully");
      fetchCommunityDetails();
    } catch (error) {
      console.error("Error adding admin:", error);
      toast.error("Failed to add admin");
    }
  };

  const handleRemoveAdmin = async (userId) => {
    try {
      await removeAdmin(id, userId, currentUser.token);
      toast.success("Admin removed successfully");
      fetchCommunityDetails();
    } catch (error) {
      console.error("Error removing admin:", error);
      toast.error("Failed to remove admin");
    }
  };

  const handleDeleteCommunity = async () => {
    if (!window.confirm("Are you sure you want to delete this community? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteCommunity(id, currentUser.token);
      toast.success("Community deleted successfully");
      navigate("/communities");
    } catch (error) {
      console.error("Error deleting community:", error);
      toast.error("Failed to delete community");
    }
  };

  const handleCommunityUpdated = () => {
    setShowEditModal(false);
    fetchCommunityDetails();
    toast.success("Community updated successfully");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Community not found</h2>
        <button
          onClick={() => navigate("/communities")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Communities
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center mb-2">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mr-2">{community.name}</h1>
                {community.isPrivate ? (
                  <Lock className="h-5 w-5 text-amber-500" />
                ) : (
                  <Unlock className="h-5 w-5 text-green-500" />
                )}
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                <Users className="h-5 w-5 mr-1" />
                <span>{community.memberIds?.length || 0} members</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Created {new Date(community.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              {userStatus.isMember ? (
                <button
                  onClick={handleLeave}
                  className="flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                >
                  <UserMinus className="h-4 w-4 mr-1" />
                  Leave
                </button>
              ) : (
                <button
                  onClick={handleJoin}
                  className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Join
                </button>
              )}

              {userStatus.isCreator && (
                <>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteCommunity}
                    className="flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mb-6">
            <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
              {community.category}
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">About</h2>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {community.description}
            </p>
          </div>

          <div className="border-t dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* This would be populated with member data from an API call */}
              {/* For now, just showing placeholder */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 mr-3">
                    U
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Creator</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Creator ID: {community.creatorId}</p>
                  </div>
                </div>
                {userStatus.isCreator && (
                  <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs">You</div>
                )}
              </div>

              {/* Admin list would go here */}
              {/* Member list would go here */}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
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
          <h3 className="text-xl font-semibold text

-gray-800 dark:text-white mb-2">No communities found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === "my"
              ? "You haven't joined any communities yet."
              : "No communities match your search criteria."}
          </p>
          {filter === "my" && (
            <button
              onClick={() => setFilter("all")}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
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

export default CommunityDetailPage;