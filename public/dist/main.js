"use strict";

let pageHasLoaded = false;

document.addEventListener("DOMContentLoaded", function(event){
    pageHasLoaded = true;
  });

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, addDoc, updateDoc, getDoc, deleteDoc, deleteField } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDksRBlObR3KJ3dxxEulNBhR4t8eVou8go",
    authDomain: "btr-todo.firebaseapp.com",
    projectId: "btr-todo",
    storageBucket: "btr-todo.appspot.com",
    messagingSenderId: "58733850825",
    appId: "1:58733850825:web:053dcdc66caab833d35d18",
    measurementId: "G-NMF2ZWD54D"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const analytics = getAnalytics(app);

const emailInput = document.getElementById("email-input");
const passwordInput = document.getElementById("password-input");
const signUpButton = document.getElementById("sign-up-btn");
const loginButton = document.getElementById("login-btn");
const googleLoginButton = document.getElementById("sign-in-with-google-btn");
const logoutButton = document.getElementById("logout-btn");

const errorText = document.getElementById("error-text");
const errorDismissButton = document.getElementById("error-dismiss-btn")

signUpButton.addEventListener("click", signUpWithEmailAndPassword);
loginButton.addEventListener("click", loginWithEmailAndPassword);
googleLoginButton.addEventListener("click", loginWithGoogle);
logoutButton.addEventListener("click", logOut);

errorDismissButton.addEventListener("click", (ev) => hideElement(errorText));

//firebase//

onAuthStateChanged(auth, (user) => {
    if(user) {
        const uid = user.uid;
        showError("Successfully logged in!", false);
        hideElement(document.getElementById("logged-out-view"));
        hideElement(document.getElementById("task-view"));
        showMenu(document.getElementById("dashboard"));
        renderTodos();
    }else{
        showError("Successfully logged out.", false);
        showMenu(document.getElementById("logged-out-view"));
        hideElement(document.getElementById("task-view"));
        hideElement(document.getElementById("dashboard"));
    }
})

function signUpWithEmailAndPassword() {
    const email = emailInput.value;
    const password = passwordInput.value;
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            showError(`${errorCode}: ${errorMessage}`, true);
            console.error(errorCode, errorMessage);
        });
    emailInput.value = "";
    passwordInput.value = "";
}

function loginWithEmailAndPassword() {
    const email = emailInput.value;
    const password = passwordInput.value;
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          showError(`${errorCode}: ${errorMessage}`, true);
          console.error(errorCode, errorMessage);
        });
    emailInput.value = "";
    passwordInput.value = "";
}

function loginWithGoogle() {
    signInWithPopup(auth, googleProvider)
        .then((result) => {
          const credential = GoogleAuthProvider.credentialFromResult(result);
          const token = credential.accessToken;
          const user = result.user;
          console.log(credential, token, user);
        }).catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          const email = error.customData.email;
          const credential = GoogleAuthProvider.credentialFromError(error);
          showError(`${errorCode}: ${errorMessage}`, true);
        });
}

function logOut() {
    signOut(auth).then(() => {
        //logged out
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        showError(`${errorCode}: ${errorMessage}`, true);
    })
}

//Dashboard view//
const createTodoButton = document.getElementById("create-todo-btn");
const todoContainer = document.getElementById("todo-container");

createTodoButton.addEventListener("click", createTodo);

todoContainer.addEventListener("click", (e) => {
    if(e.target.classList.contains("delete-btn")){
        deleteTodo(e.target.parentElement.parentElement.id);
    }else if(e.target.classList.contains("edit-btn")){
        renameTodo(e.target.parentElement.parentElement.id);
    }
    else if(e.target.tagName == "LI") {
        openTodo(e.target.id);
    }
})

async function renderTodos() {
    const user = auth.currentUser;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    todoContainer.innerHTML = "";
    if(userDoc.exists()){
        const data = await getDoc(doc(db, "users", user.uid));
        for(let key in data.data()){
            if(data.data().hasOwnProperty(key)){
                const todoButton = document.createElement("li");
                todoButton.textContent = data.data()[key].name;
                todoButton.id = data.data()[key].id;
                const deleteBtn = document.createElement("span");
                deleteBtn.innerHTML = `<i class="fa-solid fa-trash-can delete-btn"></i>`;
                const editBtn = document.createElement("span");
                editBtn.innerHTML = `<i class="fa-solid fa-pen edit-btn"></i>`;
                todoButton.appendChild(deleteBtn);
                todoButton.appendChild(editBtn);  
                todoContainer.appendChild(todoButton);
            }
        }
    }else{
        const text = document.createElement("p")
        text.textContent = "You have not created any Todo Lists yet, Press the button above to do so!"
        todoContainer.appendChild(text);
    }
}

async function openTodo(id) {
    loadTodo(id)
}

async function deleteTodo(id) {
    const user = auth.currentUser;
    const todoData = (await getDoc(doc(db, "users", user.uid))).data()[id];
    const check = prompt(`Enter ${todoData.name} to delete.`);
    if(check){
        await updateDoc(doc(db, "users", user.uid), {
            [id]: deleteField()
        });
        await deleteDoc(doc(db, "todos", id));
        renderTodos();
    }
}

async function renameTodo(id) {
    const user = auth.currentUser;
    const todoData = (await getDoc(doc(db, "users", user.uid))).data()[id];
    const newName = prompt("Enter new name for the Todo List", todoData.name);
    if(((newName !== null) || newName.length === 0)){
        await updateDoc(doc(db, "users", user.uid), {
            [id]: {
                id: id,
                name: newName
            }
        });
        renderTodos();
    }
}

async function createTodo() {
    const id = generateUUID();
    const user = auth.currentUser;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if(userDoc.exists()){
        await updateDoc(doc(db, "users", user.uid), {
            [id]: {
                name: "New Todo",
                id: id
            }
        });
        await setDoc(doc(db, "todos", id), {});
    }else{
        await setDoc(doc(db, "users", user.uid), {
            [id]: {
                name: "New Todo",
                id: id
            }
        });
        await setDoc(doc(db, "todos", id), {});
    }
    await renderTodos();
}

//Main view//

const listContainer = document.getElementById("list-container");
const inputBox = document.getElementById("input-box");
const addTaskButton = document.getElementById("add-task-btn");
const clearAllButton = document.getElementById("clear-btn");
const backToDashboardButton = document.getElementById("back-to-dashboard-btn");
const todoName = document.getElementById("todo-name");

addTaskButton.addEventListener("click", createTask);
clearAllButton.addEventListener("click", clearAll);
backToDashboardButton.addEventListener("click", () => {
    hideElement(document.getElementById("task-view"));
    showMenu(document.getElementById("dashboard"));
})

let currentTodoId = undefined;

let isEditing = false,
curEditTask = undefined;

function generateUUID() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

async function loadTodo(id){
    const user = auth.currentUser;
    const todoDoc = await getDoc(doc(db, "todos", id));
    todoName.innerHTML = `<i class="fa-solid fa-check"></i> ${(await getDoc(doc(db, "users", user.uid))).data()[id].name}`;
    if(todoDoc.exists()){
        showMenu(document.getElementById("task-view"));
        hideElement(document.getElementById("dashboard"));
        currentTodoId = id;
        refreshTasks();
    }
}

async function refreshTasks(){
    listContainer.innerHTML = "";
    const todoDoc = await getDoc(doc(db, "todos", currentTodoId));
    if(todoDoc.exists()){
        for(let key in todoDoc.data()){
            addTask(todoDoc.data()[key].text, todoDoc.data()[key].id);
        }
    }
}

async function addTask(text, id){
    let taskInfo = await getDoc(doc(db, "todos", currentTodoId));
    taskInfo = taskInfo.data()[id];

    let todo = document.createElement("li");
    todo.id = id;
    let todoText = document.createElement("p");
    todoText.textContent = text;
    todo.appendChild(todoText);
    let deleteBtn = document.createElement("span");
    deleteBtn.innerHTML = `<i class="fa-solid fa-trash-can delete-btn"></i>`;
    todo.appendChild(deleteBtn);
    let editBtn = document.createElement("span");
    editBtn.innerHTML = `<i class="fa-solid fa-pen edit-btn"></i>`;
    todo.appendChild(editBtn);
    if(taskInfo.checked){
        todo.classList.add("checked");
    }
    listContainer.appendChild(todo);
}

async function checkTask(id){
    let taskInfo = await getDoc(doc(db, "todos", currentTodoId));
    taskInfo = taskInfo.data()[id];
    await updateDoc(doc(db, "todos", currentTodoId), {
        [id]: {
            text: taskInfo.text,
            id: taskInfo.id,
            checked: !taskInfo.checked
        }
    })
    const taskEl = document.getElementById(id);
    taskEl.classList.toggle("checked");
}

async function createTask(){
    if(inputBox.value == ""){
        showError("You must type something!", true);
    }else{
        if(!isEditing){
            const uuid = generateUUID();
            await updateDoc(doc(db, "todos", currentTodoId), {
                [uuid]: {
                    text: inputBox.value,
                    id: uuid,
                    checked: false
                }
            });
            await addTask(inputBox.value, uuid);
            inputBox.value = "";
        }else{
            editTask();
        }
    }
}

async function deleteTask(id) {
    await updateDoc(doc(db, "todos", currentTodoId), {
        [id]: deleteField()
    })
    await refreshTasks();
}

async function editTask(id) {
    if(!isEditing){
        let taskInfo = await getDoc(doc(db, "todos", currentTodoId));
        taskInfo = taskInfo.data()[id];
        curEditTask = taskInfo;
        isEditing = true;
        inputBox.value = taskInfo.text;
    }else{
        await updateDoc(doc(db, "todos", currentTodoId),{
            [curEditTask.id]: {
                text: inputBox.value,
                id: curEditTask.id,
                checked: curEditTask.checked
            }
        })
        document.getElementById(curEditTask.id).childNodes[0].textContent = inputBox.value;
        inputBox.value = "";
        isEditing = false;
        curEditTask = undefined;
    }
}

async function clearAll() {
    listContainer.innerHTML = "";
    let tasksInfo = await getDoc(doc(db, "todos", currentTodoId));
    tasksInfo = tasksInfo.data();
    for(let key in tasksInfo){
        await updateDoc(doc(db, "todos", currentTodoId), {
            [key]: deleteField()
        })
    }
}

listContainer.addEventListener("click", (e) => { //check todo
    if(e.target.tagName == "LI"){
        const id = e.target.id;
        checkTask(id);
    }else if(e.target.classList.contains("delete-btn")) {
        const id = e.target.parentElement.parentElement.id;
        deleteTask(id);
    }else if(e.target.classList.contains("edit-btn")) {
        const id = e.target.parentElement.parentElement.id;
        editTask(id);
    }
})

inputBox.onkeyup = ((e) => { //create todo by pressing enter
    if(e.key == "Enter") {
        if(!isEditing){
            createTask();
        }else{
            editTask();
        }
    }
});

hideElement(errorText);

function showElement(element) {
    element.style.display = "block";
}

function showMenu(element) {
    element.style.display = "inline-flex";
}

function hideElement(element) {
    element.style.display = "none";
}

function showError(text, isError) {
    showElement(errorText);
    errorText.childNodes[0].nodeValue = text;
    if(isError){
        errorText.classList.remove("error-green");
        errorText.classList.add("error-red");
    }else{
        errorText.classList.remove("error-red");
        errorText.classList.add("error-green");
    }
}