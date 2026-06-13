from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from accounts.models import Student, Staff, User, Department
from .serializers import StudentSerializer, StudentCreateSerializer
import logging

logger = logging.getLogger(__name__)

class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department']
    search_fields = ['name', 'roll_number', 'email']
    ordering_fields = ['name', 'roll_number', 'created_at']
    
    def get_queryset(self):
        user = self.request.user
        
        if hasattr(user, 'staff_profile'):
            # Staff can only see students from their department
            staff_department = user.staff_profile.department
            return Student.objects.filter(department=staff_department)
        elif hasattr(user, 'student_profile'):
            # Student can only see themselves
            return Student.objects.filter(id=user.student_profile.id)
        return Student.objects.none()
    
    def create(self, request):
        logger.info(f"Create student request data: {request.data}")
        
        # Get data from request
        name = request.data.get('name', '').strip()
        roll_number = request.data.get('roll_number', '').strip().upper()
        email = request.data.get('email', '').strip().lower()
        department_name = request.data.get('department', '').strip()
        
        # Detailed validation
        errors = {}
        
        if not name:
            errors['name'] = 'Name is required'
        elif len(name) < 3:
            errors['name'] = 'Name must be at least 3 characters'
            
        if not roll_number:
            errors['roll_number'] = 'Roll number is required'
        elif Student.objects.filter(roll_number=roll_number).exists():
            errors['roll_number'] = 'Roll number already exists'
            
        if not email:
            errors['email'] = 'Email is required'
        elif not '@' in email or not '.' in email:
            errors['email'] = 'Enter a valid email address'
        elif Student.objects.filter(email=email).exists():
            errors['email'] = 'Email already exists'
            
        if not department_name:
            errors['department'] = 'Department is required'
        
        if errors:
            return Response({'error': errors}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is staff
        if not hasattr(request.user, 'staff_profile'):
            return Response({'error': 'Only staff can create students'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        try:
            # Get or create department
            department, created = Department.objects.get_or_create(name=department_name)
            
            # Create user
            default_password = 'Student@123'
            user = User.objects.create_user(
                username=roll_number,
                email=email,
                password=default_password,
                role='student',
                first_name=name.split()[0] if ' ' in name else name,
                last_name=name.split()[-1] if ' ' in name else ''
            )
            
            # Create student profile
            student = Student.objects.create(
                user=user,
                roll_number=roll_number,
                name=name,
                email=email,
                department=department
            )
            
            # Return the created student
            serializer = StudentSerializer(student)
            logger.info(f"Student created successfully: {student.id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating student: {str(e)}")
            return Response({'error': str(e)}, 
                          status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, pk=None):
        try:
            student = Student.objects.get(pk=pk)
            
            # Check if staff can edit this student
            if hasattr(request.user, 'staff_profile'):
                if student.department != request.user.staff_profile.department:
                    return Response({'error': 'Cannot edit students from other departments'}, 
                                  status=status.HTTP_403_FORBIDDEN)
            
            # Update fields
            name = request.data.get('name', '').strip()
            email = request.data.get('email', '').strip().lower()
            
            if name:
                student.name = name
            if email:
                # Check if email is taken by another student
                if Student.objects.filter(email=email).exclude(id=student.id).exists():
                    return Response({'error': 'Email already exists'}, 
                                  status=status.HTTP_400_BAD_REQUEST)
                student.email = email
                student.user.email = email
                student.user.save()
            
            student.save()
            
            serializer = StudentSerializer(student)
            return Response(serializer.data)
            
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error updating student: {str(e)}")
            return Response({'error': str(e)}, 
                          status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        try:
            student = Student.objects.get(pk=pk)
            
            # Check if staff can delete this student
            if hasattr(request.user, 'staff_profile'):
                if student.department != request.user.staff_profile.department:
                    return Response({'error': 'Cannot delete students from other departments'}, 
                                  status=status.HTTP_403_FORBIDDEN)
            
            # Delete user and student
            user = student.user
            student.delete()
            user.delete()
            
            return Response({'message': 'Student deleted successfully'}, 
                          status=status.HTTP_200_OK)
            
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, 
                          status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting student: {str(e)}")
            return Response({'error': str(e)}, 
                          status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        if hasattr(request.user, 'staff_profile'):
            staff = request.user.staff_profile
            if staff.department:
                total_students = Student.objects.filter(department=staff.department).count()
                recent_students = Student.objects.filter(department=staff.department).order_by('-created_at')[:5]
                
                return Response({
                    'total_students': total_students,
                    'department': staff.department.name,
                    'recent_students': StudentSerializer(recent_students, many=True).data
                })
            else:
                return Response({
                    'total_students': 0,
                    'department': 'No Department Assigned',
                    'recent_students': []
                })
        return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)