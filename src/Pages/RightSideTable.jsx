
import React, { useState, useEffect } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import "./RightSideTable.css";
import { toast } from "react-toastify";
import EditModal from "../Authentication/EditModal";
import DeleteModal from "../Authentication/DeleteModel";

const RightSideTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [brokerToEdit, setBrokerToEdit] = useState(null);
  const [brokerIdToDelete, setBrokerIdToDelete] = useState(null);
  const rowsPerPage = 10;
  const location = useLocation();
  const navigate = useNavigate();
  const { tableData: initialTableData = [] } = location.state || {};
  const [tableData, setTableData] = useState(initialTableData);

  const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = tableData.slice(startIndex, endIndex);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");
    if (!authToken || !userId) {
      toast.error("Authentication token or user ID is missing. Please log in again.");
      navigate("/");
      return;
    }

    if (!tableData.length) {
      fetchTableData();
    }
  }, [navigate, tableData.length]);

  const fetchTableData = async () => {
    const authToken = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");

    if (!authToken || !userId) {
      toast.error("Authentication token or user ID is missing. Please log in again.");
      navigate("/");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/brokers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          toast.error("Session expired. Please log in again.");
          navigate("/");
          return;
        }
        const errorMessage = await response.json().then((data) => data.message || `HTTP error! status: ${response.status}`);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const mappedData = data.map((item) => ({
        brokerId: item._id,
        brokerip: item.brokerIp || "N/A",
        port: item.portNumber ? item.portNumber.toString() : "N/A",
        user: item.username || "N/A",
        password: item.password ? "*".repeat(item.password.length) : "N/A",
        rawPassword: item.password || "",
        label: item.label || "N/A",
        connectionStatus: item.connectionStatus || "disconnected",
      }));

      setTableData(mappedData);
    } catch (err) {
      console.error("Error fetching table data:", err);
      toast.error(err.message || "An error occurred while fetching table data.");
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleDeleteClick = (brokerId) => {
    setBrokerIdToDelete(brokerId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      toast.error("Authentication token is missing. Please log in again.");
      navigate("/");
      setShowDeleteModal(false);
      setBrokerIdToDelete(null);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/brokers/${brokerIdToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          toast.error("Session expired. Please log in again.");
          navigate("/");
          setShowDeleteModal(false);
          setBrokerIdToDelete(null);
          return;
        }
        const errorMessage = await response.json().then((data) => data.message || `Failed to delete broker (Status: ${response.status})`);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success(`Broker ${brokerIdToDelete} deleted successfully!`);
      setShowDeleteModal(false);
      setBrokerIdToDelete(null);
      await fetchTableData();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.message || "An error occurred while deleting the broker.");
      setShowDeleteModal(false);
      setBrokerIdToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setBrokerIdToDelete(null);
  };

  const handleEditClick = (row) => {
    setBrokerToEdit(row);
    setShowEditModal(true);
  };

  const handleEditConfirm = async (updatedData) => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      toast.error("Authentication token is missing. Please log in again.");
      navigate("/");
      setShowEditModal(false);
      setBrokerToEdit(null);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/brokers/${brokerToEdit.brokerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          brokerIp: updatedData.brokerIp,
          portNumber: parseInt(updatedData.portNumber, 10),
          username: updatedData.username || "",
          password: updatedData.password || "",
          label: updatedData.label,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          toast.error("Session expired. Please log in again.");
          navigate("/");
          setShowEditModal(false);
          setBrokerToEdit(null);
          return;
        }
        const errorMessage = await response.json().then((data) => data.message || `Failed to update broker (Status: ${response.status})`);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success(`Broker ${brokerToEdit.brokerId} updated successfully!`);
      setShowEditModal(false);
      setBrokerToEdit(null);
      await fetchTableData();
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err.message || "An error occurred while updating the broker.");
      setShowEditModal(false);
      setBrokerToEdit(null);
    }
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setBrokerToEdit(null);
  };

  const handleAssign = async (row) => {
    const authToken = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");
    if (!authToken || !userId) {
      toast.error("Authentication token or user ID is missing. Please log in again.");
      navigate("/");
      return;
    }

    toast.info("Connecting to broker...");

    try {
      const response = await fetch(`http://localhost:5000/api/brokers/${row.brokerId}/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.json().then((data) => data.message || "Failed to connect to broker.");
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success("Broker connected successfully!");
      navigate("/dashboard", { state: { brokerId: row.brokerId, userId } });
    } catch (err) {
      console.error("Connection error:", err);
      toast.error(err.message || "An error occurred while connecting to the broker.");
    }
  };

  const backToForm = () => {
    navigate("/home");
  };

  return (
    <div className="unique-table-container">
      <button className="back-button" onClick={backToForm}>
        Back to Form
      </button>
      <div className="unique-table-scrollable">
        <table className="unique-table">
          <thead>
            <tr>
              <th>Broker IP</th>
              <th>Port</th>
              <th>User</th>
              <th>Password</th>
              <th>Company Name</th>
              <th>Actions</th>
              <th>Edit/Delete</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, index) => (
              <tr key={index}>
                <td>{row.brokerip}</td>
                <td>{row.port}</td>
                <td>{row.user}</td>
                <td>{row.password}</td>
                <td>{row.label}</td>
                <td>
                  <button
                    className={`assign-button ${row.connectionStatus === "connected" ? "" : "disconnected"}`}
                    onClick={() => handleAssign(row)}
                    title="Connect"
                  >
                    Connect
                  </button>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="edit-button"
                      onClick={() => handleEditClick(row)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(row.brokerId);
                      }}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`pagination-button ${currentPage === page ? "active" : ""}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <EditModal
        isOpen={showEditModal}
        onConfirm={handleEditConfirm}
        onCancel={handleEditCancel}
        broker={brokerToEdit}
      />
    </div>
  );
};

export default RightSideTable;

