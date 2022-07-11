'use strict'
//importando o modulo aws-sdk
const AWS = require('aws-sdk');

//importando o modulo uuid para gerar automaticamento o id_funcionario
const {v4: uuid} = require('uuid');

//instanciando o DynamoDb
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const params = {
  TableName: "FUNCIONARIOS",
};


//função que utiliza o metodo scan do DynamoDB para listar os funcionarios cadastrados
module.exports.listarFuncionarios = async (event) => {
  try {
    let data = await dynamoDb.scan(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify(data.Items),
    };
  } catch (err) {
    console.log("Error", err);
    return {
      statusCode: err.statusCode ? err.statusCode : 500,
      body: JSON.stringify({
        error: err.name ? err.name : "Exception",
        message: err.message ? err.message : "Unknown error",
      }),
    };
  }
};

//função que utiliza o metodo GET para consultar um funcionario pelo id e devolve uma mensagem de erro caso o fucnionario não exista
module.exports.obterFuncionario = async (event) => {
  try {
    const { funcionarioId } = event.pathParameters;

    const data = await dynamoDb
      .get({
        ...params,
        Key: {
          funcionario_id: funcionarioId,
        },
      })
      .promise();

    if (!data.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Funcionario não existe!" }, null, 2),
      };
    }

    const funcionario = data.Item;

    return {
      statusCode: 200,
      body: JSON.stringify(funcionario, null, 2),
    };
  } catch (err) {
    console.log("Error", err);
    return {
      statusCode: err.statusCode ? err.statusCode : 500,
      body: JSON.stringify({
        error: err.name ? err.name : "Exception",
        message: err.message ? err.message : "Unknown error",
      }),
    };
  }
};

//função que cadastra um novo funcionario
module.exports.cadastrarFuncionario = async (event) => {
  try{
    let dados = JSON.parse(event.body);

    const {
      nome, idade, cargo
    } = dados;

    const funcionario = {
      funcionario_id: uuid(),
      nome,
      idade,
      cargo,
      status: true,
    };

    await dynamoDb
      .put({
        TableName: "FUNCIONARIOS",
        Item: funcionario,
      })
      .promise();
    return {
      statusCode: 201,
    };
  } catch (err) {
    console.log("Error", err);
    return {
      statusCode: err.statusCode ? err.statusCode : 500,
      body: JSON.stringify({
        error: err.name ? err.name : "Exception",
        message: err.message ? err.message : "Unknown error",
      }),
    };
  }
};


//função que atualiza o cadastro de um fucnionario pelo id e devolve uma mensagem de erro caso o id não exista
module.exports.atualizarFuncionario = async (event) => {  
  const { funcionarioId } = event.pathParameters

  try {
    let dados = JSON.parse(event.body);

    const { nome, idade, cargo } = dados;

    await dynamoDb
      .update({
        ...params,
        Key: {
          funcionario_id: funcionarioId
        },
        UpdateExpression:
          'SET nome = :nome, idade = :idade, cargo = :cargo',
        ConditionExpression: 'attribute_exists(funcionario_id)',
        ExpressionAttributeValues: {
          ':nome': nome,
          ':idade': idade,
          ':cargo': cargo,
        }
      })
      .promise()

    return {
      statusCode: 204,
    };
  } catch (err) {
    console.log("Error", err);

    let error = err.name ? err.name : "Exception";
    let message = err.message ? err.message : "Unknown error";
    let statusCode = err.statusCode ? err.statusCode : 500;

    if (error == 'ConditionalCheckFailedException') {
      error = 'Funcionario não existe!';
      message = `Recurso com o ID ${funcionarioId} não existe e não pode ser atualizado`;
      statusCode = 404;
    }

    return {
      statusCode,
      body: JSON.stringify({
        error,
        message
      }),
    };
  }
};


//função que deleta um funcionario procurando pelo id e devolve uma mensagem de erro caso o id não exista
module.exports.excluirFuncionario = async event => {
  const { funcionarioId } = event.pathParameters

  try {
    await dynamoDb
      .delete({
        ...params,
        Key: {
          funcionario_id: funcionarioId
        },
        ConditionExpression: 'attribute_exists(funcionario_id)'
      })
      .promise()
 
    return {
      statusCode: 204
    }
  } catch (err) {
    console.log("Error", err);

    let error = err.name ? err.name : "Exception";
    let message = err.message ? err.message : "Unknown error";
    let statusCode = err.statusCode ? err.statusCode : 500;

    if (error == 'ConditionalCheckFailedException') {
      error = 'Funcionario não existe!';
      message = `Recurso com o ID ${funcionarioId} não existe e não pode ser excluido!`;
      statusCode = 404;
    }

    return {
      statusCode,
      body: JSON.stringify({
        error,
        message
      }),
    };
  }
}

