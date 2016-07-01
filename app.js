//Module
angular.module('matriculapp', ['ui.router'])

//--------------------------------------------------
//					UI Router Config
//--------------------------------------------------
.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

	//Home
  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl'
    });
	
	//Registers	
	 $stateProvider
	.state('registers', {
	  url: '/registers/{type}',
	  templateUrl: '/registers.html',
	  controller: 'RegisterCtrl'
	});

	//Restrições
   $stateProvider
	.state('restricoes', {
	  url: '/restricoes/',
	  templateUrl: '/restricoes.html',
	  controller: 'RestricoesCtrl'
	});
	
	//Matricula
  $stateProvider
	.state('matricula', {
	url: '/matricula/{creditos}/{horarios}/{nao_cursar}/{aluno_id}/{curso_id}',
	  templateUrl: '/matricula.html',
	  controller: 'MatriculaCtrl'
	});
	
  $urlRouterProvider.otherwise('home');
}])



//--------------------------------------------------
//					Main Controller
//--------------------------------------------------
.controller('MainCtrl', [
'$scope',
'$http',
function($scope, $http){
	$http.get("https://matriculapp.herokuapp.com/register")
	.then(function(response) { });
}])


//--------------------------------------------------
//					Restrições Controller
//--------------------------------------------------
.controller('RestricoesCtrl', [
'$scope',
'$http',
function($scope, $http){
	$scope.aluno_id = '';
	$scope.curso_id = '';
	
	$scope.aluno = "";
	$scope.creditos = '';
	$scope.horarios = '';
	$scope.nao_cursar = ""
	
	$scope.todas_disciplinas = '';
	$scope.loaded = false;
	
	$scope.getDisciplina = function(disc_id){
		for( m = 0; m < $scope.todas_disciplinas.length; m++ ){
			if( $scope.todas_disciplinas[m]._id.$oid == disc_id.$oid){
				return $scope.todas_disciplinas[m];
			}
		}
		return None;
	}
	
	//Loading Function
	$scope.message = ".";
	$http.get("https://matriculapp.herokuapp.com/clear")
    .then(function(response) {
		
		$scope.message = ".."
		$http.get("https://matriculapp.herokuapp.com/setup")
		.then(function(response) {
			$scope.aluno_id = response.data.data.aluno;
			$scope.curso_id = response.data.data.curso;
			
			$scope.message = "..."
			$http.get("https://matriculapp.herokuapp.com/aluno/"+$scope.aluno_id)
			.then(function(response) {
				$scope.aluno = response.data.data;
				
				$scope.message = "...."
				$http.get("https://matriculapp.herokuapp.com/disciplina/"+$scope.curso_id)
				.then(function(response) {
					$scope.todas_disciplinas = response.data.data;
					$scope.loaded = true;
				});
			});
				
			

		});
    });
	
}])


//--------------------------------------------------
//					Matricula Controller
//--------------------------------------------------
.controller('MatriculaCtrl', [
'$scope',
'$stateParams',
'$http',
function($scope, $stateParams, $http){
	//Static
	$scope.letter_to_index = {'AB':0, 'CD':1, 'EF':2, 'HI':3, 'JK':4, 'LM':5, 'NP':6}
	
	//Request Parameters
	$scope.creditos = $stateParams.creditos;
	$scope.horarios = $stateParams.horarios;
	$scope.nao_cursar = $stateParams.nao_cursar;
	$scope.aluno_id = $stateParams.aluno_id;
	$scope.curso_id = $stateParams.curso_id;
	
	//Async Loading
	$scope.aluno = "";
	$scope.turmas = "";
	$scope.disciplinas = "";
	$scope.loaded = false;
	
	//Control Info
	$scope.turmas_possiveis = [];
	$scope.generated = [
		["-","-","-","-","-","-","-"], //SEG
		["-","-","-","-","-","-","-"], //TER
		["-","-","-","-","-","-","-"], //QUA
		["-","-","-","-","-","-","-"], // QUI
		["-","-","-","-","-","-","-"], // SEX
		["-","-","-","-","-","-","-"] // SAB
		]; //[dia][horario]
	$scope.cursadas = [];
	$scope.nao_cursadas = [];
	$scope.total_credito = 0;
	
	$scope.generate = function(){
		
		//remover turmas fora das restrições
		for (i = 0; i < $scope.turmas.length; i++) {
			turma = $scope.turmas[i];
			disciplina = $scope.getDisciplina(turma.disciplina);
			prereq = disciplina.prerequisitos;
			
			turma.remove = false;	
			//remove turmars que nao quer cursar
			if ($scope.nao_cursar.indexOf(disciplina.cod_disciplina) > -1){
				turma.remove = true;				
			}
								
			//Remover todas turmas das disciplinas ja cursadas pelo aluno
			for (j = 0; j < $scope.aluno.disciplinas_cursadas.length; j++) {
				if( $scope.aluno.disciplinas_cursadas[j].$oid == turma.disciplina.$oid ){
					turma.remove = true;
				}
			}

			//Remover todas turmas que o aluno não possui os pre-requisito			
			aux = 0;
			for (j = 0; j < prereq.length; j++) {
				for( k = 0; k < $scope.aluno.disciplinas_cursadas.length; k++){
					if( $scope.aluno.disciplinas_cursadas[k].$oid == prereq[j].$oid ){
						aux++;
					}
				}
			}
			if( aux != prereq.length){
				turma.remove = true;
			}
			
			//Remover todas turmas que estão na restrição de horario do aluno
			for(n= 0; n < disciplina.creditos/2; n++){
				hor = turma.horario.substr((n*3)+1,2);
				if( $scope.horarios.indexOf(hor) > -1 ){
					turma.remove = true;
				}
			}
			
		}
		
		//criar lista com turmas possiveis
		for (i = 0; i < $scope.turmas.length; i++) {
			if( $scope.turmas[i].remove == false){
				$scope.turmas_possiveis.push($scope.turmas[i]);
			}
		}
		
		//Das turmas possiveis ir adicionando a grade e somando os creditos ate estourar os creditos
		//AB, CD, EF, HI, JK, LM, NP = 7 por 6 dias		
		for (i = 0; i < $scope.turmas_possiveis.length; i++) {
			turma = $scope.turmas_possiveis[i];
			disciplina = $scope.getDisciplina(turma.disciplina);
			
			//Testa se pode adicionar a disciplina
			canAdd = true;
			for(n= 0; n < disciplina.creditos/2; n++){
				day_index = parseInt(turma.horario.charAt(n*3))-2;
				hor_index = $scope.letter_to_index[turma.horario.substr((n*3)+1,2)];
				if( $scope.generated[day_index][hor_index] != '-' ){
					canAdd = false;
				}
			}
			
			//Testa se tem creditos
			if( $scope.total_credito + disciplina.creditos > $scope.creditos ){
				canAdd = false;
			}
			
			if( canAdd ){
				$scope.cursadas.push(turma);
				$scope.total_credito += disciplina.creditos;
				for(n= 0; n < disciplina.creditos/2; n++){
					day_index = parseInt(turma.horario.charAt(n*3))-2;
					hor_index = $scope.letter_to_index[turma.horario.substr((n*3)+1,2)];
					$scope.generated[day_index][hor_index] = turma;
				}
			}else{
				$scope.nao_cursadas.push(turma);
			}
		}
		
	}
		
	$scope.addTurma = function(index){
			turma = $scope.nao_cursadas[index];
			disciplina = $scope.getDisciplina(turma.disciplina);

			//Testa se pode adicionar a disciplina
			for(n= 0; n < disciplina.creditos/2; n++){
				day_index = parseInt(turma.horario.charAt(n*3))-2;
				hor_index = $scope.letter_to_index[turma.horario.substr((n*3)+1,2)];
				if( $scope.generated[day_index][hor_index] != '-' ){
					return alert('Conflito de horario com ' + $scope.getName($scope.generated[day_index][hor_index]));
				}
			}
			
			//Testa se tem creditos
			if( $scope.total_credito + disciplina.creditos > $scope.creditos ){
				return alert('Ultrupassa o limite de credito');
			}

			$scope.total_credito += disciplina.creditos;
			for(n= 0; n < disciplina.creditos/2; n++){
				day_index = parseInt(turma.horario.charAt(n*3))-2;
				hor_index = $scope.letter_to_index[turma.horario.substr((n*3)+1,2)];
				$scope.generated[day_index][hor_index] = turma;
			}
			
			$scope.nao_cursadas.splice(index, 1);
			$scope.cursadas.push(turma);
			
	};	
	
	$scope.removeTurma = function(index){
			turma = $scope.cursadas[index];
			disciplina = $scope.getDisciplina(turma.disciplina);
			$scope.total_credito -= disciplina.creditos;
			loop = 0;
			for(n= 0; n < disciplina.creditos/2; n++){
				day_index = parseInt(turma.horario.charAt(n*3))-2;
				hor_index = $scope.letter_to_index[turma.horario.substr((n*3)+1,2)];
				$scope.generated[day_index][hor_index] = '-';
				loop++;
			}
			$scope.cursadas.splice(index, 1);
			$scope.nao_cursadas.push(turma);
	
	}
	
	$scope.getDisciplina = function(disc_id){
		for( m = 0; m < $scope.disciplinas.length; m++ ){
			if( $scope.disciplinas[m]._id.$oid == disc_id.$oid){
				return $scope.disciplinas[m];
			}
		}
		return None;
	}
	
	$scope.getName = function(dados){
		if( dados == '-' ) return "-";
		else return $scope.getDisciplina(dados.disciplina).cod_disciplina;
	};
	
	$scope.getDayName = function(index){
		names = {0:'Seg', 1:'Ter', 2:'Qua', 3:'Qui', 4:'Sex', 5:'Sab' };
		return names[index];
	};
	
	
	//Async Loading Function
	$scope.message = "."
	$http.get("https://matriculapp.herokuapp.com/aluno/"+$scope.aluno_id)
	.then(function(response) {
		$scope.aluno = response.data.data;
		
		$scope.message = ".."
		$http.get("https://matriculapp.herokuapp.com/turma/"+$scope.curso_id)
		.then(function(response) {
			$scope.turmas = response.data.data;
			
			$scope.message = "..."
			$http.get("https://matriculapp.herokuapp.com/disciplina/"+$scope.curso_id)
			.then(function(response) {
				$scope.disciplinas = response.data.data;
				$scope.loaded = true;
				$scope.generate();
			});
		});
		
	});
	
}])



//--------------------------------------------------
//					Register Controller
//--------------------------------------------------
.controller('RegisterCtrl', [
'$scope',
'$http',
'$stateParams',
function($scope, $http, $stateParams){
	$scope.type = $stateParams.type;
	$scope.registers = [];
	$scope.message = "Loading ...";
	
	if( $scope.type != 'day' && $scope.type != 'week' && $scope.type != 'month'){
		$scope.type = 'day';
	}
	
	$http.get("https://matriculapp.herokuapp.com/register/"+$scope.type)
	.then(function(response) {
		
		if( $scope.type == 'day'){
			$scope.comp = "Hoje";
		}else if ( $scope.type == 'week'){
			$scope.comp = "Essa Semana";
		}else{
			$scope.comp = "Esse Mes";			
		}
		$scope.registers = response.data.data;
		

		$scope.message = response.data.data.length + " Acessos " + $scope.comp;
	

	});
	
	$scope.formatedDate = function(registerdate){
		return new Date(registerdate.$date).toUTCString();
	}
	
}])

//--------------------------------------------------
//					END
//--------------------------------------------------
;