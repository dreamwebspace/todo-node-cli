const readline = require('readline');
const fs = require('fs');

const TASKS_FILE = 'tasks.json';

class Task {
  constructor(description, priority = 'norm', completed = false, subtasks = []) {
    this.description = description;
    this.completed = completed;
    this.subtasks = subtasks;
    this.priority = priority;
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
      const tasksData = JSON.parse(data);
      this.tasks = tasksData.map(taskData =>
        new Task(taskData.description, taskData.priority, taskData.completed,
          taskData.subtasks.map(subtaskData =>
            new Task(subtaskData.description, subtaskData.priority, subtaskData.completed)
          )
        )
      );
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
    this.listTasks();
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
      case '+':
        this.increasePriority(args[0]);
        break;
      case '-':
        this.decreasePriority(args[0]);
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
      this.listTasks();
    }

    this.saveTasks();
    console.log();
    this.promptUser();
  }

  addTask(description) {
    this.tasks.push(new Task(description));
  }

  addSubtask(taskIndex, description) {
    const index = parseInt(taskIndex) - 1;
    if (this.isValidIndex(index)) {
      this.tasks[index].subtasks.push(new Task(description));
    } else {
      console.log('Invalid task number.');
      console.log();
    }
  }

  listTasks() {
    if (this.tasks.length === 0) {
      console.log('No tasks.');
      return;
    }

    const sortedTasks = [...this.tasks].sort((a, b) => {
      const priorityOrder = { 'high': 0, 'norm': 1, 'low ': 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    sortedTasks.forEach((task, index) => {
      const originalIndex = this.tasks.indexOf(task) + 1;
      console.log(`${originalIndex}. [${task.completed ? 'X' : ' '}] [${task.priority}] ${task.description}`);
      task.subtasks.forEach((subtask, subIndex) => {
        console.log(`   ${originalIndex}.${subIndex + 1}. [${subtask.completed ? 'X' : ' '}] ${subtask.description}`);
      });
    });
  }

  toggleComplete(identifier) {
    const [taskIndex, subtaskIndex] = this.parseIdentifier(identifier);
    if (this.isValidIndex(taskIndex)) {
      if (subtaskIndex !== undefined) {
        if (this.isValidSubtaskIndex(taskIndex, subtaskIndex)) {
          this.tasks[taskIndex].subtasks[subtaskIndex].completed = !this.tasks[taskIndex].subtasks[subtaskIndex].completed;
        } else {
          console.log('Invalid subtask number.');
          console.log();
        }
      } else {
        this.tasks[taskIndex].completed = !this.tasks[taskIndex].completed;
      }
    } else {
      console.log('Invalid task number.');
      console.log();
    }
  }

  removeTask(identifier) {
    const [taskIndex, subtaskIndex] = this.parseIdentifier(identifier);
    if (this.isValidIndex(taskIndex)) {
      if (subtaskIndex !== undefined) {
        if (this.isValidSubtaskIndex(taskIndex, subtaskIndex)) {
          this.tasks[taskIndex].subtasks.splice(subtaskIndex, 1);
        } else {
          console.log('Invalid subtask number.');
          console.log();
        }
      } else {
        this.tasks.splice(taskIndex, 1);
      }
    } else {
      console.log('Invalid task number.');
      console.log();
    }
  }

  moveTaskUp(identifier) {
    const [taskIndex, subtaskIndex] = this.parseIdentifier(identifier);
    if (this.isValidIndex(taskIndex)) {
      if (subtaskIndex !== undefined) {
        if (this.isValidSubtaskIndex(taskIndex, subtaskIndex) && subtaskIndex > 0) {
          this.swapArrayElements(this.tasks[taskIndex].subtasks, subtaskIndex, subtaskIndex - 1);
        } else {
          console.log('Cannot move subtask up.');
        }
      } else if (taskIndex > 0) {
        this.swapArrayElements(this.tasks, taskIndex, taskIndex - 1);
      } else {
        console.log('Cannot move task up.');
      }
    } else {
      console.log('Invalid task number.');
      console.log();
    }
  }

  moveTaskDown(identifier) {
    const [taskIndex, subtaskIndex] = this.parseIdentifier(identifier);
    if (this.isValidIndex(taskIndex)) {
      if (subtaskIndex !== undefined) {
        if (this.isValidSubtaskIndex(taskIndex, subtaskIndex) && subtaskIndex < this.tasks[taskIndex].subtasks.length - 1) {
          this.swapArrayElements(this.tasks[taskIndex].subtasks, subtaskIndex, subtaskIndex + 1);
        } else {
          console.log('Cannot move subtask down.');
        }
      } else if (taskIndex < this.tasks.length - 1) {
        this.swapArrayElements(this.tasks, taskIndex, taskIndex + 1);
      } else {
        console.log('Cannot move task down.');
      }
    } else {
      console.log('Invalid task number.');
      console.log();
    }
  }

  renameTask(identifier, newDescription) {
    const [taskIndex, subtaskIndex] = this.parseIdentifier(identifier);
    if (this.isValidIndex(taskIndex)) {
      if (subtaskIndex !== undefined) {
        if (this.isValidSubtaskIndex(taskIndex, subtaskIndex)) {
          this.tasks[taskIndex].subtasks[subtaskIndex].description = newDescription;
        } else {
          console.log('Invalid subtask number.');
          console.log();
        }
      } else {
        this.tasks[taskIndex].description = newDescription;
      }
    } else {
      console.log('Invalid task number.');
      console.log();
    }
  }

  increasePriority(taskIndex) {
    const index = parseInt(taskIndex) - 1;
    if (this.isValidIndex(index)) {
      const priorityOrder = ['low ', 'norm', 'high'];
      const currentPriority = this.tasks[index].priority;
      const currentIndex = priorityOrder.indexOf(currentPriority);
      if (currentIndex < priorityOrder.length - 1) {
        this.tasks[index].priority = priorityOrder[currentIndex + 1];
      }
    } else {
      console.log('Invalid task number.');
      console.log();
    }
  }

  decreasePriority(taskIndex) {
    const index = parseInt(taskIndex) - 1;
    if (this.isValidIndex(index)) {
      const priorityOrder = ['low ', 'norm', 'high'];
      const currentPriority = this.tasks[index].priority;
      const currentIndex = priorityOrder.indexOf(currentPriority);
      if (currentIndex > 0) {
        this.tasks[index].priority = priorityOrder[currentIndex - 1];
      }
    } else {
      console.log('Invalid task number.');
      console.log();
    }
  }

  showHelp() {
    console.log('Available commands:');
    console.log('a <task description> - Add a new task');
    console.log('s <task number> <subtask description> - Add a subtask to a task');
    console.log('t - List all tasks');
    console.log('x <task number>.<subtask number> - Mark task or subtask as complete/incomplete');
    console.log('d <task number>.<subtask number> - Remove task or subtask');
    console.log('h <task number>.<subtask number> - Move task or subtask higher');
    console.log('l <task number>.<subtask number> - Move task or subtask lower');
    console.log('r <task number>.<subtask number> <new description> - Rename task or subtask');
    console.log('+ <task number> - Increase task priority');
    console.log('- <task number> - Decrease task priority');
    console.log('? - Show this help message');
    console.log('q - Quit the application');
  }

  quit() {
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
