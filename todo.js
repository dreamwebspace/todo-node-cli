const readline = require('readline');
const fs = require('fs');

const TASKS_FILE = 'tasks.json';

class Task {
  constructor(description) {
    this.description = description;
    this.completed = false;
    this.subtasks = [];
  }
}

class TodoApp {
  constructor() {
    this.tasks = [];
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.loadTasks();
  }

  loadTasks() {
    try {
      const data = fs.readFileSync(TASKS_FILE, 'utf8');
      this.tasks = JSON.parse(data);
    } catch (err) {
      this.tasks = [];
    }
  }

  saveTasks() {
    const data = JSON.stringify(this.tasks, null, 2);
    fs.writeFileSync(TASKS_FILE, data, 'utf8');
  }

  start() {
    console.log();
    console.log('Type ? for help or q to quit.');
    console.log();
    this.listTasks();  // Display tasks at start
    console.log();
    this.promptUser();
  }

  promptUser() {
    this.rl.question('> ', (input) => {
      console.log();
      this.handleInput(input);
    });
  }

  handleInput(input) {
    const [command, ...args] = input.split(' ');

    switch (command) {
      case 'a':
        this.addTask(args.join(' '));
        break;
      case 's':
        this.addSubtask(args[0], args.slice(1).join(' '));
        break;
      case 't':
        this.listTasks();
        break;
      case 'x':
        this.toggleComplete(args[0]);
        break;
      case 'd':
        this.removeTask(args[0]);
        break;
      case 'h':
        this.moveTaskUp(args[0]);
        break;
      case 'l':
        this.moveTaskDown(args[0]);
        break;
      case 'r':
        this.renameTask(args[0], args.slice(1).join(' '));
        break;
      case '?':
        this.showHelp();
        break;
      case 'q':
        this.quit();
        return;
      default:
        console.log('Invalid command. Type ? for help.');
    }

    if (command !== 't' && command !== '?') {
      //  console.log();
      this.listTasks();
    }

    this.saveTasks();
    console.log();
    this.promptUser();
  }

  addTask(description) {
    this.tasks.push(new Task(description));
    //    console.log('Task added successfully.');
  }

  addSubtask(taskIndex, description) {
    const index = parseInt(taskIndex) - 1;
    if (this.isValidIndex(index)) {
      this.tasks[index].subtasks.push(new Task(description));
      //      console.log('Subtask added successfully.');
    } else {
      console.log('Invalid task number.');
    }
  }

  listTasks() {
    if (this.tasks.length === 0) {
      console.log('No tasks.');
      return;
    }

    // console.log('Current tasks:');
    this.tasks.forEach((task, index) => {
      console.log(`${index + 1}. [${task.completed ? 'X' : ' '}] ${task.description}`);
      task.subtasks.forEach((subtask, subIndex) => {
        console.log(`   ${index + 1}.${subIndex + 1}. [${subtask.completed ? 'X' : ' '}] ${subtask.description}`);
      });
    });
  }

  toggleComplete(identifier) {
    const [taskIndex, subtaskIndex] = this.parseIdentifier(identifier);
    if (this.isValidIndex(taskIndex)) {
      if (subtaskIndex !== undefined) {
        if (this.isValidSubtaskIndex(taskIndex, subtaskIndex)) {
          this.tasks[taskIndex].subtasks[subtaskIndex].completed = !this.tasks[taskIndex].subtasks[subtaskIndex].completed;
          //        console.log('Subtask status toggled.');
        } else {
          console.log('Invalid subtask number.');
        }
      } else {
        this.tasks[taskIndex].completed = !this.tasks[taskIndex].completed;
        //    console.log('Task status toggled.');
      }
    } else {
      console.log('Invalid task number.');
    }
  }

  removeTask(identifier) {
    const [taskIndex, subtaskIndex] = this.parseIdentifier(identifier);
    if (this.isValidIndex(taskIndex)) {
      if (subtaskIndex !== undefined) {
        if (this.isValidSubtaskIndex(taskIndex, subtaskIndex)) {
          this.tasks[taskIndex].subtasks.splice(subtaskIndex, 1);
          //    console.log('Subtask removed successfully.');
        } else {
          console.log('Invalid subtask number.');
        }
      } else {
        this.tasks.splice(taskIndex, 1);
        //        console.log('Task removed successfully.');
      }
    } else {
      console.log('Invalid task number.');
    }
  }

  moveTaskUp(identifier) {
    const [taskIndex, subtaskIndex] = this.parseIdentifier(identifier);
    if (this.isValidIndex(taskIndex)) {
      if (subtaskIndex !== undefined) {
        if (this.isValidSubtaskIndex(taskIndex, subtaskIndex) && subtaskIndex > 0) {
          this.swapArrayElements(this.tasks[taskIndex].subtasks, subtaskIndex, subtaskIndex - 1);
          //        console.log('Subtask moved up.');
        } else {
          console.log('Cannot move subtask up.');
        }
      } else if (taskIndex > 0) {
        this.swapArrayElements(this.tasks, taskIndex, taskIndex - 1);
        //    console.log('Task moved up.');
      } else {
        console.log('Cannot move task up.');
      }
    } else {
      console.log('Invalid task number.');
    }
  }

  moveTaskDown(identifier) {
    const [taskIndex, subtaskIndex] = this.parseIdentifier(identifier);
    if (this.isValidIndex(taskIndex)) {
      if (subtaskIndex !== undefined) {
        if (this.isValidSubtaskIndex(taskIndex, subtaskIndex) && subtaskIndex < this.tasks[taskIndex].subtasks.length - 1) {
          this.swapArrayElements(this.tasks[taskIndex].subtasks, subtaskIndex, subtaskIndex + 1);
          //          console.log('Subtask moved down.');
        } else {
          console.log('Cannot move subtask down.');
        }
      } else if (taskIndex < this.tasks.length - 1) {
        this.swapArrayElements(this.tasks, taskIndex, taskIndex + 1);
        //      console.log('Task moved down.');
      } else {
        console.log('Cannot move task down.');
      }
    } else {
      console.log('Invalid task number.');
    }
  }

  renameTask(identifier, newDescription) {
    const [taskIndex, subtaskIndex] = this.parseIdentifier(identifier);
    if (this.isValidIndex(taskIndex)) {
      if (subtaskIndex !== undefined) {
        if (this.isValidSubtaskIndex(taskIndex, subtaskIndex)) {
          this.tasks[taskIndex].subtasks[subtaskIndex].description = newDescription;
          //      console.log('Subtask renamed successfully.');
        } else {
          console.log('Invalid subtask number.');
        }
      } else {
        this.tasks[taskIndex].description = newDescription;
        //  console.log('Task renamed successfully.');
      }
    } else {
      console.log('Invalid task number.');
    }
  }

  showHelp() {
    console.log('Available commands:');
    console.log('a <task description> - Add a new task');
    console.log('s <task number> <subtask description> - Add a subtask to a task');
    console.log('t - List all tasks');
    console.log('x <task number>[.<subtask number>] - Mark task or subtask as complete/incomplete');
    console.log('d <task number>[.<subtask number>] - Remove task or subtask');
    console.log('h <task number>[.<subtask number>] - Move task or subtask higher');
    console.log('l <task number>[.<subtask number>] - Move task or subtask lower');
    console.log('r <task number>[.<subtask number>] <new description> - Rename task or subtask');
    console.log('? - Show this help message');
    console.log('q - Quit the application');
  }

  quit() {
    //    console.log('Goodbye!');
    this.rl.close();
  }

  isValidIndex(index) {
    return index >= 0 && index < this.tasks.length;
  }

  isValidSubtaskIndex(taskIndex, subtaskIndex) {
    return subtaskIndex >= 0 && subtaskIndex < this.tasks[taskIndex].subtasks.length;
  }

  parseIdentifier(identifier) {
    const [taskStr, subtaskStr] = identifier.split('.');
    const taskIndex = parseInt(taskStr) - 1;
    const subtaskIndex = subtaskStr ? parseInt(subtaskStr) - 1 : undefined;
    return [taskIndex, subtaskIndex];
  }

  swapArrayElements(array, index1, index2) {
    [array[index1], array[index2]] = [array[index2], array[index1]];
  }
}

const app = new TodoApp();
app.start();
