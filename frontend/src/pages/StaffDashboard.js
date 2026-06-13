import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Pagination, Navbar, Nav, Alert, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash, FaEye, FaSearch, FaPlus, FaSignOutAlt, FaUserGraduate, FaBuilding, FaUsers, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const StaffDashboard = () => {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({
    total_students: 0,
    department: '',
    recent_students: []
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [formData, setFormData] = useState({
    name: '',
    roll_number: '',
    email: '',
    department: ''
  });
  
  const navigate = useNavigate();
  const itemsPerPage = 10;
  const userName = localStorage.getItem('user_name');

  // Fetch students function wrapped in useCallback
  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/students/');
      let studentsData = response.data.results || response.data;
      if (!Array.isArray(studentsData)) {
        studentsData = [studentsData];
      }
      setStudents(studentsData);
    } catch (error) {
      console.error('Fetch students error:', error);
      toast.error('Failed to fetch students');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/students/stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  }, []);

  // Fixed useEffect with proper dependencies
  useEffect(() => {
    fetchStudents();
    fetchStats();
  }, [fetchStudents, fetchStats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.name || !formData.roll_number || !formData.email || !formData.department) {
        toast.error('Please fill all required fields');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address');
        return;
    }
    
    // Validate roll number (alphanumeric)
    const rollRegex = /^[A-Za-z0-9]+$/;
    if (!rollRegex.test(formData.roll_number)) {
        toast.error('Roll number should contain only letters and numbers');
        return;
    }
    
    try {
        setLoading(true);
        
        // Prepare data for API
        const studentData = {
            name: formData.name.trim(),
            roll_number: formData.roll_number.trim().toUpperCase(),
            email: formData.email.trim().toLowerCase(),
            department: formData.department.trim()
        };
        
        console.log("Sending data:", studentData); // Debug log
        
        if (editingStudent) {
            await api.put(`/students/${editingStudent.id}/`, studentData);
            toast.success('Student updated successfully');
        } else {
            const response = await api.post('/students/', studentData);
            console.log("Response:", response.data); // Debug log
            toast.success('Student added successfully! Default password: Student@123');
        }
        
        setShowModal(false);
        resetForm();
        fetchStudents();
        fetchStats();
    } catch (error) {
        console.error("Submit error:", error);
        console.error("Error response:", error.response);
        
        if (error.response?.data?.error) {
            const errorData = error.response.data.error;
            if (typeof errorData === 'object') {
                Object.values(errorData).forEach(err => toast.error(err));
            } else {
                toast.error(errorData);
            }
        } else if (error.response?.data?.message) {
            toast.error(error.response.data.message);
        } else {
            toast.error('Operation failed. Please check the console for details.');
        }
    } finally {
        setLoading(false);
    }
};

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      try {
        await api.delete(`/students/${id}/`);
        toast.success('Student deleted successfully');
        fetchStudents();
        fetchStats();
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete student');
      }
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      roll_number: student.roll_number,
      email: student.email,
      department: student.department
    });
    setShowModal(true);
  };

  const handleView = (student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      roll_number: '',
      email: '',
      department: ''
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_name');
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <FaSort className="ms-1" />;
    return sortOrder === 'asc' ? <FaSortUp className="ms-1" /> : <FaSortDown className="ms-1" />;
  };

  // Filter and sort students
  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(search.toLowerCase()) ||
    student.roll_number?.toLowerCase().includes(search.toLowerCase()) ||
    student.email?.toLowerCase().includes(search.toLowerCase())
  );

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';
    if (sortField === 'name') {
      aVal = a.name || '';
      bVal = b.name || '';
    }
    if (sortOrder === 'asc') {
      return aVal.toString().localeCompare(bVal.toString());
    } else {
      return bVal.toString().localeCompare(aVal.toString());
    }
  });

  const paginatedStudents = sortedStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <h4 className="mt-3">Loading dashboard...</h4>
      </Container>
    );
  }

  return (
    <>
      <Navbar bg="dark" variant="dark" className="mb-4" expand="lg">
        <Container fluid>
          <Navbar.Brand href="#">
            <FaUserGraduate className="me-2" />
            Staff Dashboard
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Collapse id="navbar-nav">
            <Nav className="ms-auto">
              <Navbar.Text className="me-3 text-white">
                Welcome, <strong>{userName}</strong>
              </Navbar.Text>
              <Button variant="outline-light" onClick={handleLogout}>
                <FaSignOutAlt className="me-1" /> Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="px-4">
        {/* Statistics Cards */}
        <Row className="mb-4">
          <Col md={4} sm={12} className="mb-3">
            <Card className="text-center bg-primary text-white shadow">
              <Card.Body>
                <FaUsers size={40} className="mb-2" />
                <h2 className="mb-0">{stats.total_students || 0}</h2>
                <p className="mb-0">Total Students</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} sm={12} className="mb-3">
            <Card className="text-center bg-success text-white shadow">
              <Card.Body>
                <FaBuilding size={40} className="mb-2" />
                <h5 className="mb-0">{stats.department || 'N/A'}</h5>
                <p className="mb-0">Department</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} sm={12} className="mb-3">
            <Card className="text-center bg-info text-white shadow">
              <Card.Body>
                <Button variant="light" size="lg" onClick={() => setShowModal(true)} className="mt-2">
                  <FaPlus className="me-2" /> Add New Student
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Recent Students Preview */}
        {stats.recent_students && stats.recent_students.length > 0 && (
          <Row className="mb-4">
            <Col xs={12}>
              <Card className="shadow-sm">
                <Card.Header className="bg-secondary text-white">
                  <h5 className="mb-0">Recently Added Students</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex flex-wrap gap-2">
                    {stats.recent_students.map((student, idx) => (
                      <Badge key={idx} bg="light" text="dark" className="p-2">
                        {student.name} ({student.roll_number})
                      </Badge>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Student Management Table */}
        <Card className="shadow">
          <Card.Header className="bg-white">
            <Row className="align-items-center">
              <Col md={6}>
                <h4 className="mb-0">Student Management</h4>
              </Col>
              <Col md={6}>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    placeholder="Search by name, roll number, or email..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="me-2"
                  />
                  <Button variant="outline-primary">
                    <FaSearch />
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Header>
          <Card.Body>
            {paginatedStudents.length === 0 ? (
              <Alert variant="info" className="text-center">
                <FaUserGraduate size={50} className="mb-3" />
                <h5>No students found</h5>
                <p>Click the "Add New Student" button to add your first student.</p>
              </Alert>
            ) : (
              <>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead className="table-dark">
                      <tr>
                        <th style={{ width: '50px' }}>#</th>
                        <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                          Name {getSortIcon('name')}
                        </th>
                        <th onClick={() => handleSort('roll_number')} style={{ cursor: 'pointer' }}>
                          Roll Number {getSortIcon('roll_number')}
                        </th>
                        <th>Department</th>
                        <th>Email</th>
                        <th style={{ width: '150px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedStudents.map((student, index) => (
                        <tr key={student.id}>
                          <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                          <td>
                            <strong>{student.name}</strong>
                            <br />
                            <small className="text-muted">ID: {student.id}</small>
                          </td>
                          <td>
                            <Badge bg="secondary">{student.roll_number}</Badge>
                          </td>
                          <td>{student.department_name || student.department}</td>
                          <td>{student.email}</td>
                          <td>
                            <Button 
                              variant="info" 
                              size="sm" 
                              className="me-2"
                              onClick={() => handleView(student)}
                              title="View Details"
                            >
                              <FaEye />
                            </Button>
                            <Button 
                              variant="warning" 
                              size="sm" 
                              className="me-2"
                              onClick={() => handleEdit(student)}
                              title="Edit"
                            >
                              <FaEdit />
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => handleDelete(student.id)}
                              title="Delete"
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination className="justify-content-center mt-3">
                    <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
                    
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Pagination.Item 
                          key={pageNum} 
                          active={pageNum === currentPage}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Pagination.Item>
                      );
                    })}
                    
                    <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
                    <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                  </Pagination>
                )}
                
                <div className="text-muted mt-2 text-end">
                  Showing {paginatedStudents.length} of {sortedStudents.length} students
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Add/Edit Student Modal */}
      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        resetForm();
      }} size="lg">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            {editingStudent ? <><FaEdit className="me-2" /> Edit Student</> : <><FaPlus className="me-2" /> Add New Student</>}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter student's full name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Roll Number *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.roll_number}
                    onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                    required
                    disabled={!!editingStudent}
                    placeholder="Unique roll number"
                  />
                  {editingStudent && (
                    <Form.Text className="text-muted">Roll number cannot be changed</Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="student@example.com"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                    disabled={!!editingStudent}
                    placeholder="Department name"
                  />
                  {editingStudent && (
                    <Form.Text className="text-muted">Department cannot be changed</Form.Text>
                  )}
                </Form.Group>
              </Col>
            </Row>
            {!editingStudent && (
              <Alert variant="info" className="mt-2">
                <small>Default password for new student: <strong>Student@123</strong></small>
                <br />
                <small>Student can change password after first login</small>
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {
              setShowModal(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingStudent ? 'Update Student' : 'Add Student'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Student Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton className="bg-info text-white">
          <Modal.Title>
            <FaEye className="me-2" /> Student Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStudent && (
            <div>
              <Row className="mb-3">
                <Col md={6}>
                  <Card className="bg-light">
                    <Card.Body>
                      <small className="text-muted">Full Name</small>
                      <h5>{selectedStudent.name}</h5>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="bg-light">
                    <Card.Body>
                      <small className="text-muted">Roll Number</small>
                      <h5>{selectedStudent.roll_number}</h5>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Card className="bg-light">
                    <Card.Body>
                      <small className="text-muted">Email Address</small>
                      <h5>{selectedStudent.email}</h5>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="bg-light">
                    <Card.Body>
                      <small className="text-muted">Department</small>
                      <h5>{selectedStudent.department_name || selectedStudent.department}</h5>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Card className="bg-light">
                    <Card.Body>
                      <small className="text-muted">Registration Date</small>
                      <h5>{new Date(selectedStudent.created_at).toLocaleDateString()}</h5>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="bg-light">
                    <Card.Body>
                      <small className="text-muted">Student ID</small>
                      <h5>#{selectedStudent.id}</h5>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StaffDashboard;