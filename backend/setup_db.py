import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import Department, User, Staff, Student
from django.contrib.auth.hashers import make_password

def setup_database():
    print("Setting up database...")
    
    # Create departments
    departments = [
        'Computer Science',
        'Electrical Engineering',
        'Mechanical Engineering',
        'Civil Engineering',
        'Business Administration'
    ]
    
    for dept_name in departments:
        dept, created = Department.objects.get_or_create(name=dept_name)
        if created:
            print(f"✓ Created department: {dept_name}")
        else:
            print(f"• Department exists: {dept_name}")
    
    # Create sample staff
    staff_list = [
        {'name': 'Dr. John Smith', 'email': 'john.smith@university.edu', 'dept': 'Computer Science', 'password': 'Staff@123'},
        {'name': 'Prof. Sarah Johnson', 'email': 'sarah.johnson@university.edu', 'dept': 'Electrical Engineering', 'password': 'Staff@123'},
        {'name': 'Dr. Michael Brown', 'email': 'michael.brown@university.edu', 'dept': 'Business Administration', 'password': 'Staff@123'},
    ]
    
    for staff_data in staff_list:
        if not Staff.objects.filter(email=staff_data['email']).exists():
            department = Department.objects.get(name=staff_data['dept'])
            user = User.objects.create_user(
                username=staff_data['email'],
                email=staff_data['email'],
                password=staff_data['password'],
                role='staff'
            )
            staff = Staff.objects.create(
                user=user,
                name=staff_data['name'],
                email=staff_data['email'],
                department=department
            )
            print(f"✓ Created staff: {staff_data['name']}")
        else:
            print(f"• Staff exists: {staff_data['name']}")
    
    # Create sample students
    student_list = [
        {'name': 'Alice Johnson', 'roll': 'CS2024001', 'email': 'alice@student.edu', 'dept': 'Computer Science', 'password': 'Student@123'},
        {'name': 'Bob Williams', 'roll': 'CS2024002', 'email': 'bob@student.edu', 'dept': 'Computer Science', 'password': 'Student@123'},
        {'name': 'Carol Davis', 'roll': 'EE2024001', 'email': 'carol@student.edu', 'dept': 'Electrical Engineering', 'password': 'Student@123'},
        {'name': 'David Miller', 'roll': 'ME2024001', 'email': 'david@student.edu', 'dept': 'Mechanical Engineering', 'password': 'Student@123'},
        {'name': 'Emma Wilson', 'roll': 'CS2024003', 'email': 'emma@student.edu', 'dept': 'Computer Science', 'password': 'Student@123'},
        {'name': 'Frank Thomas', 'roll': 'CE2024001', 'email': 'frank@student.edu', 'dept': 'Civil Engineering', 'password': 'Student@123'},
        {'name': 'Grace Lee', 'roll': 'BA2024001', 'email': 'grace@student.edu', 'dept': 'Business Administration', 'password': 'Student@123'},
    ]
    
    for student_data in student_list:
        if not Student.objects.filter(roll_number=student_data['roll']).exists():
            department = Department.objects.get(name=student_data['dept'])
            user = User.objects.create_user(
                username=student_data['roll'],
                email=student_data['email'],
                password=student_data['password'],
                role='student'
            )
            student = Student.objects.create(
                user=user,
                roll_number=student_data['roll'],
                name=student_data['name'],
                email=student_data['email'],
                department=department
            )
            print(f"✓ Created student: {student_data['name']} ({student_data['roll']})")
        else:
            print(f"• Student exists: {student_data['name']}")
    
    print("\n" + "="*50)
    print("DATABASE SETUP COMPLETE!")
    print("="*50)
    print("\nLogin Credentials:")
    print("\nSTAFF LOGINS:")
    for staff in staff_list:
        print(f"  Email: {staff['email']}")
        print(f"  Password: {staff['password']}")
        print()
    
    print("STUDENT LOGINS:")
    for student in student_list[:3]:  # Show first 3 students
        print(f"  Roll Number: {student['roll']}")
        print(f"  Password: {student['password']}")
        print()
    
    print("To login as student, use their ROLL NUMBER as username")
    print("To login as staff, use their EMAIL as username")

if __name__ == '__main__':
    setup_database()