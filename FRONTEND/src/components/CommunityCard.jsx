import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Lock, Unlock, UserPlus, UserMinus, Clock, MoreHorizontal, Edit, Trash } from "lucide-react";
import { joinCommunity, leaveCommunity, isMember, isAdmin, isCreator, deleteCommunity } from "../api/communityAPI";
import toast from "react-hot-toast";
import EditCommunityModal from "./EditCommunityModal";

const CommunityCard = ({ community, currentUser, onJoin, onLeave, onUpdate }) => {
  const [isUserMember, setIsUserMember] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [isUserCreator, setIsUserCreator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const popupRef = useRef(null);

  // Check if the user is a member of the community when the component mounts

  useEffect(() => {
    const checkUserRoles = async () => {
      if (currentUser && community) {
        try {
          // Check if user is a member
          const memberResponse = await isMember(community.id, currentUser.id, currentUser.token);
          setIsUserMember(memberResponse.data);

          // Check if user is an admin
          const adminResponse = await isAdmin(community.id, currentUser.id, currentUser.token);
          setIsUserAdmin(adminResponse.data);

          // Check if user is the creator
          const creatorResponse = await isCreator(community.id, currentUser.id, currentUser.token);
          setIsUserCreator(creatorResponse.data);
        } catch (error) {
          console.error("Error checking user roles:", error);
        }
      }
    };

    checkUserRoles();
  }, [community, currentUser]);

  const handleJoin = async () => {
    if (!currentUser) {
      toast.error("Please log in to join communities");
      return;
    }

    setLoading(true);
    try {
      await joinCommunity(community.id, currentUser.id, currentUser.token);
      setIsUserMember(true);
      toast.success(`You've joined ${community.name}`);
      if (onJoin) onJoin(community.id);
    } catch (error) {
      console.error("Error joining community:", error);
      toast.error("Failed to join community");
    } finally {
      setLoading(false);
    }
  };
  // Function to handle joining the community
  // This function is called when the user clicks the "Join" button

  const handleLeave = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      await leaveCommunity(community.id, currentUser.id, currentUser.token);
      setIsUserMember(false);
      toast.success(`You've left ${community.name}`);
      if (onLeave) onLeave(community.id);
    } catch (error) {
      console.error("Error leaving community:", error);
      toast.error("Failed to leave community");
    } finally {
      setLoading(false);
    }
  };

  const handlePopupAction = async (action) => {
    if (action === "view") {
      window.location.href = `/communities/${community.id}`;
    } else if (action === "edit") {
      try {
        // Check if user is an admin or creator before allowing edit
        const adminResponse = await isAdmin(community.id, currentUser.id, currentUser.token);
        const creatorResponse = await isCreator(community.id, currentUser.id, currentUser.token);

        if (adminResponse.data || creatorResponse.data) {
          setShowEditModal(true);
        } else {
          toast.error("You don't have permission to edit this community");
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        toast.error("Failed to verify permissions");
      }
    } else if (action === "delete") {
      try {
        // Check if user is a creator before allowing delete
        const creatorResponse = await isCreator(community.id, currentUser.id, currentUser.token);

        if (creatorResponse.data) {
          if (window.confirm(`Are you sure you want to delete the community "${community.name}"? This action cannot be undone.`)) {
            handleDeleteCommunity();
          }
        } else {
          toast.error("Only the community creator can delete this community");
        }
      } catch (error) {
        console.error("Error checking permissions:", error);
        toast.error("Failed to verify permissions");
      }
    } else if (action === "report") {
      toast.success("Report submitted for review");
    }
    setIsPopupOpen(false);
  };

  const handleDeleteCommunity = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Double-check permissions before deleting
      const creatorResponse = await isCreator(community.id, currentUser.id, currentUser.token);

      if (creatorResponse.data) {
        await deleteCommunity(community.id, currentUser.token);
        toast.success(`Community "${community.name}" has been deleted`);
        if (onUpdate) onUpdate();
      } else {
        toast.error("Only the community creator can delete this community");
      }
    } catch (error) {
      console.error("Error deleting community:", error);
      toast.error("Failed to delete community");
    } finally {
      setLoading(false);
    }
  };

  const handleCommunityUpdated = () => {
    setShowEditModal(false);
    if (onUpdate) onUpdate();
    toast.success("Community updated successfully");
  };
// Function to handle actions from the popup menu
//community group implementation
  return (
    <div className="bg-white dark:bg-black rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 w-full max-w-4xl mx-auto">
      <div className="p-5 ">
        <div className="flex justify-between items-start mb-3">
          <Link to={`/communities/${community.id}`} className="hover:underline">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{community.name}</h3>
          </Link>
          <div className="flex items-center">
            <Users className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-1" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {community.memberIds?.length || 0} members
            </span>
          </div>
        </div>

        <div className="flex items-center mb-3">
          {community.isPrivate ? (
            <Lock className="h-4 w-4 text-amber-500 mr-1" />
          ) : (
            <Unlock className="h-4 w-4 text-green-500 mr-1" />
          )}

          <span className="text-sm text-gray-600 dark:text-gray-300">
            {community.isPrivate ? "Private community" : "Public community"}
          </span>
        </div>


        <div className="flex items-center mb-3">
          <Clock className="h-4 w-4 text-blue-500 mr-1" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Active hours: {community.activeHours || "All day"}
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
          {community.description}
        </p>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {community.category}
          </span>

          <div className="flex items-center space-x-2">
            {isUserMember ? (
              <button
                onClick={handleLeave}
                disabled={loading}
                className="flex items-center text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md transition-colors duration-200"
              >
                <UserMinus className="h-4 w-4 mr-1" />
                Leave
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={loading}
                className="flex items-center text-sm bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-md transition-colors duration-200"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Join
              </button>
            )}

            <div className="relative" ref={popupRef}>
              <button
                onClick={() => setIsPopupOpen(!isPopupOpen)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <MoreHorizontal className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              {isPopupOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handlePopupAction("view")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    View Details
                  </button>

                  {/* Edit option - visible to everyone */}
                  <button
                    onClick={() => handlePopupAction("edit")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Edit size={14} className="mr-2 text-blue-500" />
                    Edit Community
                  </button>

                  {/* Delete option - visible to everyone */}
                  <button
                    onClick={() => handlePopupAction("delete")}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Trash size={14} className="mr-2" />
                    Delete Community
                  </button>

                  {/* Report option - visible to everyone */}
                  <button
                    onClick={() => handlePopupAction("report")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Report Community
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Community Modal */}
      {showEditModal && (
        <EditCommunityModal
          community={community}
          onClose={() => setShowEditModal(false)}
          onCommunityUpdated={handleCommunityUpdated}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default CommunityCard;