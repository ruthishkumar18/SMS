import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Navbar, Nav, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaUserGraduate, FaEnvelope, FaIdCard, FaCalendarAlt, FaBuilding, FaSignOutAlt, FaUserCircle, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api';

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userName = localStorage.getItem('user_name');

  // Fetch student profile function wrapped in useCallback
  const fetchStudentProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/students/');
      let data = response.data.results || response.data;
      
      if (Array.isArray(data) && data.length > 0) {
        setStudentData(data[0]);
      } else if (data && typeof data === 'object') {
        setStudentData(data);
      } else {
        setStudentData(null);
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
      toast.error('Failed to fetch profile data');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Fixed useEffect with proper dependency
  useEffect(() => {
    fetchStudentProfile();
  }, [fetchStudentProfile]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_name');
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <h4 className="mt-3">Loading your profile...</h4>
      </Container>
    );
  }

  return (
    <>
      <Navbar bg="dark" variant="dark" className="mb-4" expand="lg">
        <Container fluid>
          <Navbar.Brand href="#">
            <FaUserGraduate className="me-2" />
            Student Dashboard
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

      <Container className="mb-5">
        {/* Welcome Banner */}
        <Row className="mb-4">
          <Col xs={12}>
            <Card className="bg-primary text-white shadow">
              <Card.Body>
                <Row className="align-items-center">
                  <Col md={8}>
                    <h2 className="mb-2">Welcome, {studentData?.name || 'Student'}!</h2>
                    <p className="mb-0">This is your personal dashboard. Here you can view your profile information.</p>
                  </Col>
                  <Col md={4} className="text-center">
                    <FaUserCircle size={80} className="text-white" />
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Profile Information */}
        <Row className="justify-content-center">
          <Col lg={8} md={10}>
            <Card className="shadow-lg">
              <Card.Header className="bg-success text-white">
                <h4 className="mb-0">
                  <FaUserGraduate className="me-2" />
                  My Profile Information
                </h4>
              </Card.Header>
              <Card.Body className="p-4">
                {studentData ? (
                  <>
                    <Alert variant="success" className="mb-4">
                      <FaCheckCircle className="me-2" />
                      Your account is active and verified. Below are your details.
                    </Alert>
                    
                    <Table borderless className="profile-table">
                      <tbody>
                        <tr>
                          <td style={{ width: '180px', backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                            <FaIdCard className="me-2 text-primary" />
                            S.NO / Student ID
                          </td>
                          <td>
                            <strong>#{studentData.id}</strong>
                            <Badge bg="secondary" className="ms-2">Active</Badge>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                            <FaUserGraduate className="me-2 text-primary" />
                            Full Name
                          </td>
                          <td>
                            <strong>{studentData.name}</strong>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                            <FaIdCard className="me-2 text-primary" />
                            Roll Number
                          </td>
                          <td>
                            <Badge bg="info" size="lg">{studentData.roll_number}</Badge>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                            <FaBuilding className="me-2 text-primary" />
                            Department
                          </td>
                          <td>
                            <strong>{studentData.department_name || studentData.department}</strong>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                            <FaEnvelope className="me-2 text-primary" />
                            Email Address
                          </td>
                          <td>
                            <a href={`mailto:${studentData.email}`}>{studentData.email}</a>
                          </td>
                        </tr>
                        <tr>
                          <td style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                            <FaCalendarAlt className="me-2 text-primary" />
                            Registration Date
                          </td>
                          <td>{formatDate(studentData.created_at)}</td>
                        </tr>
                        <tr>
                          <td style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                            Last Updated
                          </td>
                          <td>{formatDate(studentData.updated_at)}</td>
                        </tr>
                      </tbody>
                    </Table>

                    <Alert variant="info" className="mt-3">
                      <small>
                        <strong>Note:</strong> This information is read-only. For any corrections or updates,
                        please contact your department staff.
                      </small>
                    </Alert>
                  </>
                ) : (
                  <Alert variant="warning" className="text-center">
                    <FaUserGraduate size={50} className="mb-3" />
                    <h5>No profile data found</h5>
                    <p>Please contact your administrator if you believe this is an error.</p>
                  </Alert>
                )}
              </Card.Body>
            </Card>

            {/* Additional Information Card */}
            <Card className="mt-4 shadow-sm">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">Important Information</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>📚 Academic Guidelines</h6>
                    <ul className="text-muted">
                      <li>Maintain minimum 75% attendance</li>
                      <li>Complete assignments on time</li>
                      <li>Follow code of conduct</li>
                    </ul>
                  </Col>
                  <Col md={6}>
                    <h6>📞 Contact Support</h6>
                    <ul className="text-muted">
                      <li>Email: support@university.edu</li>
                      <li>Phone: +1 234 567 8900</li>
                      <li>Office Hours: Mon-Fri 9AM-5PM</li>
                    </ul>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <style jsx>{`
        .profile-table tr {
          border-bottom: 1px solid #dee2e6;
        }
        .profile-table td {
          padding: 15px;
        }
        .profile-table tr:last-child {
          border-bottom: none;
        }
        @media (max-width: 768px) {
          .profile-table td {
            padding: 10px;
          }
        }
      `}</style>
    </>
  );
};

export default StudentDashboard;