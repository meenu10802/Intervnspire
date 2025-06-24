const mongoose = require('mongoose');
const Question = require('./models/question');
const Challenge = require('./models/challenge');
const connectDB = require('./config/db');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Question.deleteMany({ topic: { $in: ['DBMS', 'PROGRAMMING'] } });
    await Challenge.deleteMany({ topic: 'DBMS' });
    console.log('Existing DBMS and PROGRAMMING questions and challenges cleared');

    // Seed DBMS Questions
    const dbmsQuestions = [
      { question: 'What is SQL?', answer: 'SQL stands for Structured Query Language, used for managing and manipulating relational databases.' },
      { question: 'What are the different types of SQL statements?', answer: 'The major types are SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, and others like TRUNCATE and GRANT.' },
      { question: 'What is a primary key?', answer: 'A primary key is a column (or a set of columns) in a table that uniquely identifies each row in that table.' },
      { question: 'What is a foreign key?', answer: 'A foreign key is a column (or set of columns) in one table that is used to establish a link to the primary key of another table.' },
      { question: 'What are the types of joins in SQL?', answer: 'The main types of joins are INNER JOIN, LEFT JOIN, RIGHT JOIN, FULL OUTER JOIN, and CROSS JOIN.' },
      { question: 'What is the difference between INNER JOIN and LEFT JOIN?', answer: 'INNER JOIN returns only the rows with matching values in both tables, while LEFT JOIN returns all rows from the left table, with matching rows from the right table, and NULL for non-matching rows from the right table.' },
      { question: 'What is the difference between UNION and UNION ALL?', answer: 'UNION removes duplicate rows, while UNION ALL returns all rows, including duplicates.' },
      { question: 'What is normalization?', answer: 'Normalization is the process of organizing data in a database to reduce redundancy and dependency by dividing large tables into smaller ones and defining relationships between them.' },
      { question: 'What is denormalization?', answer: 'Denormalization is the process of introducing redundancy into a table by merging tables, often to improve read performance at the expense of storage space and update complexity.' },
      { question: 'What are the different normal forms in database design?', answer: 'The normal forms are: 1NF (First Normal Form), 2NF (Second Normal Form), 3NF (Third Normal Form), and BCNF (Boyce-Codd Normal Form), with each step aimed at reducing redundancy.' },
      // ... include all 100 DBMS questions from your original seed.js ...
    ];

    await Question.insertMany(dbmsQuestions.map(q => ({
      ...q,
      topic: 'DBMS',
      subTopic: 'Concepts',
      completedBy: [],
      notes: []
    })));
    console.log(`${dbmsQuestions.length} DBMS questions seeded`);

    // Seed PROGRAMMING Questions (Java and Python)
    const programmingQuestions = [
      // Java Questions
      { question: 'What is the difference between JDK, JRE, and JVM?', answer: 'JDK is the Java Development Kit, JRE is the Java Runtime Environment, and JVM is the Java Virtual Machine that executes Java bytecode.', programmingLanguage: 'java' },
      { question: 'What is a Java interface?', answer: 'An interface in Java is a blueprint of a class, defining methods without implementation that a class must implement.', programmingLanguage: 'java' },
      { question: 'What is polymorphism in Java?', answer: 'Polymorphism allows methods to do different things based on the object calling it, achieved via method overriding or overloading.', programmingLanguage: 'java' },
      // Python Questions
      { question: 'What is the difference between a list and a tuple in Python?', answer: 'A list is mutable and can be modified, while a tuple is immutable and cannot be changed after creation.', programmingLanguage: 'python' },
      { question: 'What are Python decorators?', answer: 'Decorators are a way to modify or extend the behavior of functions or methods without changing their code.', programmingLanguage: 'python' },
      { question: 'What is a Python generator?', answer: 'A generator is a function that yields values one at a time, allowing efficient iteration over large datasets.', programmingLanguage: 'python' },
    ];

    await Question.insertMany(programmingQuestions.map(q => ({
      ...q,
      topic: 'PROGRAMMING',
      subTopic: 'Concepts',
      completedBy: [],
      notes: []
    })));
    console.log(`${programmingQuestions.length} PROGRAMMING questions seeded`);

    // Seed DBMS Challenges
    const challenges = [
      { section: 1, title: 'Select Employees by Salary', description: 'Select employees with salary less than 60000.', sampleQuery: 'SELECT * FROM employees WHERE salary < 60000;', expectedOutput: 'List of employees with salary < 60000' },
      { section: 1, title: 'Count Employees', description: 'Count total employees in the table.', sampleQuery: 'SELECT COUNT(*) FROM employees;', expectedOutput: 'Total number of employees' },
      { section: 1, title: 'Average Salary', description: 'Calculate the average salary of employees.', sampleQuery: 'SELECT AVG(salary) FROM employees;', expectedOutput: 'Average salary value' },
      { section: 1, title: 'List Departments', description: 'List all department names.', sampleQuery: 'SELECT department_name FROM departments;', expectedOutput: 'List of department names' },
      { section: 1, title: 'Employees by Hire Date', description: 'Select employees hired after 2019.', sampleQuery: 'SELECT * FROM employees WHERE hire_date > "2019-01-01";', expectedOutput: 'List of employees hired after 2019' },
      { section: 1, title: 'Filter by Name', description: 'Select employees with names starting with "B".', sampleQuery: 'SELECT * FROM employees WHERE first_name LIKE "B%";', expectedOutput: 'List of employees with names starting with B' },
      { section: 1, title: 'Group by Department', description: 'Count employees per department.', sampleQuery: 'SELECT department_id, COUNT(*) FROM employees GROUP BY department_id;', expectedOutput: 'Department-wise employee count' },
      { section: 1, title: 'Max Salary', description: 'Find the maximum salary in the company.', sampleQuery: 'SELECT MAX(salary) FROM employees;', expectedOutput: 'Highest salary value' },
      { section: 1, title: 'Order by Salary', description: 'List employees ordered by salary descending.', sampleQuery: 'SELECT * FROM employees ORDER BY salary DESC;', expectedOutput: 'Employees sorted by salary' },
      { section: 1, title: 'Simple Join', description: 'Join employees with departments.', sampleQuery: 'SELECT e.first_name, d.department_name FROM employees e JOIN departments d ON e.department_id = d.department_id;', expectedOutput: 'Employee names with department names' },
      { section: 2, title: 'Join with Condition', description: 'Join employees and departments where salary > 70000.', sampleQuery: 'SELECT e.first_name, d.department_name FROM employees e JOIN departments d ON e.department_id = d.department_id WHERE e.salary > 70000;', expectedOutput: 'High-salary employees with department names' },
      { section: 2, title: 'Subquery Example', description: 'Find employees with salary above average.', sampleQuery: 'SELECT * FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);', expectedOutput: 'Employees with above-average salary' },
      // Add more challenges to reach 50
      ...Array.from({ length: 38 }, (_, i) => ({
        section: Math.floor((i + 2) / 10) + 2,
        title: `Challenge ${i + 13}`,
        description: `Perform SQL operation ${i + 13} on employees table.`,
        sampleQuery: `SELECT * FROM employees WHERE condition_${i + 13};`,
        expectedOutput: `Result of operation ${i + 13}`
      }))
    ];

    await Challenge.insertMany(challenges.map(c => ({
      ...c,
      topic: 'DBMS',
      subTopic: 'Challenges'
    })));
    console.log(`${challenges.length} DBMS challenges seeded`);

    console.log('Seeding completed');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
};

seedData();