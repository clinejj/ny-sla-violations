const maintenanceProcessors = require('../queues/maintenance');

let job = {}; 
job.progress = (progress) => { 
  if (Math.random() < 0.1) { 
    console.log(progress); 
  } 
};

(async () => {
  console.log(await maintenanceProcessors.updateData(job));
})();
