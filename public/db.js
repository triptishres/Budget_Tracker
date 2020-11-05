let db;

const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
  // creating object store called "pending" and setting autoIncrement to true
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

  // checking if the app if online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
  // creating a transaction on the pending db with readwrite access
  const transaction = db.transaction(["pending"], "readwrite");

  // accessing the pending object store
  const store = transaction.objectStore("pending");

  // adding record to the store with the add method.
  store.add(record);
}

function checkDatabase() {
  // opening a transaction on pending db
  const transaction = db.transaction(["pending"], "readwrite");
  // accessing the pending object store
  const store = transaction.objectStore("pending");
  // getting all the records from store and setting to a variable
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
          // if successful, opening a transaction on the pending db
          const transaction = db.transaction(["pending"], "readwrite");

          // accessing pending object store
          const store = transaction.objectStore("pending");

          // clearing all items in the store
          store.clear();
        });
    }
  };
}

// listenning for app
window.addEventListener("online", checkDatabase);
