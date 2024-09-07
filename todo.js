const fs = require('fs');
const readline = require('readline');

class Task {
  constructor(description, isCompleted = false) {
    this.description = description;
    this.isCompleted = isCompleted;
  }
}

class TodoApp {
  constructor() {
    this.tasks = [];
    this.fileName = 'tasks.json';
    this.loadTasks();
  }

  loadTasks() {
    try {
      const data = fs.readFileSync(this.fileName, 'utf8');
      this.tasks = JSON.parse(data).map(task => new Task(task.description, task.isCompleted));
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Error reading file:', err);
      }
    }
  }

  saveTasks() {
    const data = JSON.stringify(this.tasks);
    fs.writeFileSync(this.fileName, data);
  }

  addTask(description) {
    this.tasks.push(new Task(description));
    this.saveTasks();
    this.listTasks();
  }

  listTasks() {
    if (this.tasks.length === 0) {
      console.log('No tasks.');
    } else {
      console.log(' ');
      this.tasks.forEach((task, index) => {
        const status = task.isCompleted ? '[X]' : '[ ]';
        console.log(`${index + 1}. ${status} ${task.description}`);
      });
      console.log('');
    }
  }

  toggleTaskCompletion(index) {
    if (index >= 0 && index < this.tasks.length) {
      this.tasks[index].isCompleted = !this.tasks[index].isCompleted;
      this.saveTasks();
      const status = this.tasks[index].isCompleted ? "completed" : "incomplete";
      this.listTasks();
    } else {
      console.log('Invalid task number.');
    }
  }

  removeTask(index) {
    if (index >= 0 && index < this.tasks.length) {
      const removedTask = this.tasks.splice(index, 1)[0];
      this.saveTasks();
      this.listTasks();
    } else {
      console.log('Invalid task number.');
    }
  }

  moveTaskUp(index) {
    if (index > 0 && index < this.tasks.length) {
      const task = this.tasks.splice(index, 1)[0];
      this.tasks.splice(index - 1, 0, task);
      this.saveTasks();
      this.listTasks();
    } else {
      console.log('Cannot move task up.');
    }
  }

  moveTaskDown(index) {
    if (index >= 0 && index < this.tasks.length - 1) {
      const task = this.tasks.splice(index, 1)[0];
      this.tasks.splice(index + 1, 0, task);
      this.saveTasks();
      this.listTasks();
    } else {
      console.log('Cannot move task down.');
    }
  }

  renameTask(index, newDescription) {
    if (index >= 0 && index < this.tasks.length) {
      const oldDescription = this.tasks[index].description;
      this.tasks[index].description = newDescription;
      this.saveTasks();
      console.log('  From:', oldDescription);
      console.log('  To:  ', newDescription);
      this.listTasks();
    } else {
      console.log('Invalid task number.');
    }
  }

  processCommand(command) {
    const parts = command.split(' ');
    const action = parts[0].toLowerCase();
    switch (action) {
      case 'a':
        if (parts.length > 1) {
          this.addTask(parts.slice(1).join(' '));
        } else {
          console.log('Usage: a <task description>');
        }
        break;
      case 't':
        this.listTasks();
        break;
      case 'x':
        if (parts.length > 1) {
          const taskNumber = parseInt(parts[1]);
          if (!isNaN(taskNumber)) {
            this.toggleTaskCompletion(taskNumber - 1);
          } else {
            console.log('Invalid task number.');
          }
        } else {
          console.log('Usage: x <task number>');
        }
        break;
      case 'd':
        if (parts.length > 1) {
          const taskNumber = parseInt(parts[1]);
          if (!isNaN(taskNumber)) {
            this.removeTask(taskNumber - 1);
          } else {
            console.log('Invalid task number.');
          }
        } else {
          console.log('Usage: d <task number>');
        }
        break;
      case 'h':
        if (parts.length > 1) {
          const taskNumber = parseInt(parts[1]);
          if (!isNaN(taskNumber)) {
            this.moveTaskUp(taskNumber - 1);
          } else {
            console.log('Invalid task number.');
          }
        } else {
          console.log('Usage: h <task number>');
        }
        break;
      case 'l':
        if (parts.length > 1) {
          const taskNumber = parseInt(parts[1]);
          if (!isNaN(taskNumber)) {
            this.moveTaskDown(taskNumber - 1);
          } else {
            console.log('Invalid task number.');
          }
        } else {
          console.log('Usage: l <task number>');
        }
        break;
      case 'r':
        if (parts.length > 2) {
          const taskNumber = parseInt(parts[1]);
          if (!isNaN(taskNumber)) {
            const newDescription = parts.slice(2).join(' ');
            this.renameTask(taskNumber - 1, newDescription);
          } else {
            console.log('Invalid task number.');
          }
        } else {
          console.log('Usage: r <task number> <new task description>');
        }
        break;
      case 'q':
        console.log('Goodbye!');
        process.exit(0);
      case '?':
        this.printHelp();
        break;
      default:
        console.log('Unknown command. Type "?" for help.');
    }
  }

  printHelp() {
    console.log('Available commands:');
    console.log('  a <task description> - Add a new task');
    console.log('  t - List all tasks');
    console.log('  x <task number> - Mark task as complete/incomplete');
    console.log('  d <task number> - Remove task');
    console.log('  h <task number> - Move task higher');
    console.log('  l <task number> - Move task lower');
    console.log('  r <task number> <new description> - Rename task');
    console.log('  ? - Show this help message');
    console.log('  q - Quit the application');
  }

  run() {
    this.listTasks();  // Display tasks at the start

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const promptUser = () => {
      rl.question('> ', (input) => {
        if (input.trim() !== '') {
          this.processCommand(input);
        }
        promptUser();
      });
    };

    promptUser();
  }
}

new TodoApp().run();
