const Sequelize = require('sequelize');

const {log, biglog, errorlog, colorize} = require("./out");

const {models} = require('./model');

exports.helpCmd = rl =>{
	 log("Commandos");
      log(" h|help - Muestra esta ayuda.");
      log(" list - Listar los quizzes existentes.");
      log(" show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
      log(" add - Añadir un nuevo quiz interactivamente.");
      log(" delete <id> - Borrar el quiz indicado.");
      log(" edit <id> - Editar el quiz indicado.");
      log(" test <id> - Probar el quiz indicado.");
      log(" p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
      log(" credits - Créditos.");
      log(" q|quit - Salir del programa.");
      rl.prompt();
  };

/////////AUXILIARES/////////

const makeQuestion = (rl, text) => {

  return new Sequelize.Promise((resolve, reject) => {
    rl.question(colorize(text, 'red'), answer => {
      resolve(answer.trim());
    });
  });
};

const validateId = id => {

   return new Sequelize.Promise((resolve,reject) => {
     if (typeof id === "undefined"){
       reject(new Error(`Falta el parámetro <id>.`));
     } else {
       id = parseInt(id);
       if (Number.isNaN(id)){
         reject(new Error(`El valor del parámetro <id> no es un número.`));

       } else {
         resolve(id);
       }
     }
   });
};
/////////////////////////////


exports.listCmd = rl =>{
	 
    models.quiz.findAll()
    .each(quiz => {
            log(` [${colorize(quiz.id, 'magenta')}]:  ${quiz.question}`);
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
  });
      
};



exports.showCmd =  (rl,id) =>{       
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz =>{
      if (!quiz){
        throw new Error(`No existe un quiz asociado al id=${id}.`);
      }
      log(`[${colorize(quiz.id,'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
    })
    .catch(error => {
      errorlog(error.message);
    })
    .then(() => {
      rl.prompt();
    });
  };



exports.addCmd = (rl) =>{


    makeQuestion(rl, ' Introduzca una pregunta: ')
    .then(q => {
      return makeQuestion(rl, ' Introduzca la respuesta: ')
      .then(a => {
        return {question: q, answer: a};
      });
    })
    .then(quiz => {
      return models.quiz.create(quiz);
    })
    .then((quiz) => {
      log(` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`)
    })
    .catch(Sequelize.ValidationError, error => {
      errorlog('El quiz es erróneo:');
      error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
      errorlog(error.message);
    })
    .then(() => {
      rl.prompt();
  });
  };



exports.deleteCmd = (rl,id) =>{
	 
   validateId(id)
   .then(id => models.quiz.destroy({where: {id}}))
   .catch(error =>{
      errorlog(error.message);
   })

   .then(()=>{
    rl.prompt();
   })
  };


exports.editCmd = (rl,id) =>{
	 
    validateId(id)
   .then(id => models.quiz.findById(id))
   .then(quiz =>{
    if (!quiz){
       throw new Error(`No existe un quiz asociado al id=${id}.`);
     }
      process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
      return makeQuestion(rl, ' Introduzca la pregunta: ')
      .then(q => {
          process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
          return makeQuestion(rl, 'Introduzca la respuesta: ')
          .then(a => {
              quiz.question = q;
              quiz.answer = a;
              return quiz;
       });
     });
   })
   .then(quiz => {
     return quiz.save();
   })
   .then(quiz => {
     log(`Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`)
   })
    .catch(Sequelize.ValidationError, error => {
      errorlog('El quiz es erroneo:');
      error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
      errorlog(error.message);
    })
    .then(() => {
      rl.prompt();
  });

};

exports.testCmd = (rl,id) =>{
	 
    validateId(id)
   .then(id => models.quiz.findById(id))
   .then(quiz =>{
    if (!quiz){
       throw new Error(`No existe un quiz asociado al id=${id}.`);
     }
    
    log(`[${colorize(quiz.id,'magenta')}]: ${quiz.question}: `);
    return makeQuestion(rl, ' Introduzca la respuesta: ')
    .then(a => {

            if(quiz.answer.toLowerCase().trim() === a.toLowerCase().trim()){

                log("Respuesta correcta");

                biglog('Correcta', 'green');

            } else{

                log("Respuesta incorrecta");

                biglog('Incorrecta', 'red');

            }

        });
       }) 
     .catch(Sequelize.ValidationError, error => {
      errorlog('El quiz es erroneo:');
      error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
      errorlog(error.message);
    })
    .then(() => {
      rl.prompt();
  });
}; 


exports.playCmd = (rl) =>{
/*
    
    let puntuacion = 0;
    let porResolver = [];
      
    for (var i = 0; i < model.count(); i++) {
            porResolver.push(model.getByIndex(i));
        
    };
const azar = () => {
    let id = Math.floor(Math.random()*porResolver.length);
}

const playOne = () => {

    if (porResolver.length === 0){
        log("No hay mas preguntas", "magenta");
        biglog(`${puntuacion}`, 'magenta');
        rl.prompt();
    
    }else{

        let id = Math.floor(Math.random()*porResolver.length);
        let quiz = porResolver[id];
        porResolver.splice(id,1)

                
       

        
            rl.question(`${colorize(quiz.question, 'red')} `, question => {
                
                if(question.toLowerCase() === quiz.answer.toLowerCase()){
                     puntuacion+=1;     
                                  

                if(porResolver.length === 0){
                        log(`No hay nada más que preguntar\nFin del juego. Aciertos: ${puntuacion}`);
                        biglog(`${puntuacion}`, "magenta");
                    }else{
                            log(`CORRECTO - Llevas ${puntuacion} aciertos`);
                            playOne();
                        };
                }else{
                    log(`INCORRECTO\nFin del juego. Total aciertos: ${puntuacion}`);
                    biglog(`${puntuacion}`, 'magenta');
                }
                rl.prompt();
            });
        };

}
playOne();*/

    let puntuacion = 0;
    let porResolver = [];
    const azar = () => {
    Math.floor(Math.random()*porResolver.length);
    }
let score = 0; 
    
    const playOne = () => {
        return new Sequelize.Promise((resolve,reject) => { 
            if(porResolver.length <=0){ 
                console.log("No hay nada más que preguntar."); 
                console.log("Fin del juego.Aciertos: "); 
                resolve(); 
                biglog(score, 'magenta'); 
               return; 
            } 

            let id =  Math.floor(Math.random()*porResolver.length); 
            let quiz = porResolver[id];
            porResolver.splice(id,1); 
            makeQuestion(rl, colorize(quiz.question + '? ', 'red')) 
            .then(answer => { 
                if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){ 
                    score++; 
                    console.log("CORRECTO - Lleva ",score, "aciertos"); 
                    resolve(playOne()); 
                } else {
                    console.log("INCORRECTO."); 
                    console.log("Fin del examen. Aciertos:"); 
                    resolve(); 
                    biglog(score, 'magenta'); 
                }    
            }) 
}) 
    } 
    models.quiz.findAll({raw: true}) 
    .then(quizzes => { 
        porResolver = quizzes; 
      }) 
    .then(() => { 
       return playOne(); 
    }) 
    .catch(error => { 
        console.log(error); 
    }) 
    .then(() => { 
        rl.prompt(); 
}) 

};