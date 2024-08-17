const inquirer = require('inquirer');
const pool = require('./db');
const cTable = require('console.table');
const viewAllDepartments = async () => {
  const result = await pool.query('SELECT * FROM department');
  console.table(result.rows);
};
const viewAllRoles = async () => {
  const result = await pool.query(`
    SELECT role.id, role.title, department.name AS department, role.salary 
    FROM role 
    JOIN department ON role.department_id = department.id
  `);
  console.table(result.rows);
};
const viewAllEmployees = async () => {
  const result = await pool.query(`
    SELECT e.id, e.first_name, e.last_name, role.title, department.name AS department, role.salary, 
    CONCAT(m.first_name, ' ', m.last_name) AS manager 
    FROM employee e 
    JOIN role ON e.role_id = role.id 
    JOIN department ON role.department_id = department.id 
    LEFT JOIN employee m ON e.manager_id = m.id
  `);
  console.table(result.rows);
};
const addDepartment = async () => {
  const { name } = await inquirer.prompt([
    {
      name: 'name',
      type: 'input',
      message: 'Enter the department name:',
    },
  ]);
  await pool.query('INSERT INTO department (name) VALUES ($1)', [name]);
  console.log(`Added department: ${name}`);
};
const addRole = async () => {
  const departments = await pool.query('SELECT * FROM department');
  const departmentChoices = departments.rows.map(({ id, name }) => ({
    name: name,
    value: id,
  }));

  const { title, salary, department_id } = await inquirer.prompt([
    {
      name: 'title',
      type: 'input',
      message: 'Enter the role title:',
    },
    {
      name: 'salary',
      type: 'input',
      message: 'Enter the role salary:',
    },
    {
      name: 'department_id',
      type: 'list',
      message: 'Select the department for the role:',
      choices: departmentChoices,
    },
  ]);

  await pool.query(
    'INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)',
    [title, salary, department_id]
  );
  console.log(`Added role: ${title}`);
};
const addEmployee = async () => {
  const roles = await pool.query('SELECT * FROM role');
  const roleChoices = roles.rows.map(({ id, title }) => ({
    name: title,
    value: id,
  }));

  const employees = await pool.query('SELECT * FROM employee');
  const managerChoices = employees.rows.map(({ id, first_name, last_name }) => ({
    name: `${first_name} ${last_name}`,
    value: id,
  }));
  managerChoices.unshift({ name: 'None', value: null });

  const { first_name, last_name, role_id, manager_id } = await inquirer.prompt([
    {
      name: 'first_name',
      type: 'input',
      message: 'Enter the employee\'s first name:',
    },
    {
      name: 'last_name',
      type: 'input',
      message: 'Enter the employee\'s last name:',
    },
    {
      name: 'role_id',
      type: 'list',
      message: 'Select the employee\'s role:',
      choices: roleChoices,
    },
    {
      name: 'manager_id',
      type: 'list',
      message: 'Select the employee\'s manager:',
      choices: managerChoices,
    },
  ]);

  await pool.query(
    'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)',
    [first_name, last_name, role_id, manager_id]
  );
  console.log(`Added employee: ${first_name} ${last_name}`);
};
const updateEmployeeRole = async () => {
  const employees = await pool.query('SELECT * FROM employee');
  const employeeChoices = employees.rows.map(({ id, first_name, last_name }) => ({
    name: `${first_name} ${last_name}`,
    value: id,
  }));

  const roles = await pool.query('SELECT * FROM role');
  const roleChoices = roles.rows.map(({ id, title }) => ({
    name: title,
    value: id,
  }));

  const { employee_id, role_id } = await inquirer.prompt([
    {
      name: 'employee_id',
      type: 'list',
      message: 'Select the employee to update:',
      choices: employeeChoices,
    },
    {
      name: 'role_id',
      type: 'list',
      message: 'Select the new role:',
      choices: roleChoices,
    },
  ]);

  await pool.query(
    'UPDATE employee SET role_id = $1 WHERE id = $2',
    [role_id, employee_id]
  );
  console.log('Updated employee role');
};
const mainMenu = async () => {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'View All Departments',
        'View All Roles',
        'View All Employees',
        'Add a Department',
        'Add a Role',
        'Add an Employee',
        'Update an Employee Role',
        'Exit'
      ],
    },
  ]);

  switch (action) {
    case 'View All Departments':
      await viewAllDepartments();
      break;
    case 'View All Roles':
      await viewAllRoles();
      break;
    case 'View All Employees':
      await viewAllEmployees();
      break;
    case 'Add a Department':
      await addDepartment();
      break;
    case 'Add a Role':
      await addRole();
      break;
    case 'Add an Employee':
      await addEmployee();
      break;
    case 'Update an Employee Role':
      await updateEmployeeRole();
      break;
    case 'Exit':
      console.log('Goodbye!');
      pool.end();
      process.exit();
  }
  mainMenu(); // Loop back to main menu after action is completed
};

mainMenu();
