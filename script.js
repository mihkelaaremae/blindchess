Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

const copyToClipboard = str => {
	const el = document.createElement('textarea');
	el.value = str;
	el.setAttribute('readonly', '');
	el.style.position = 'absolute';
	el.style.left = '-9999px';
	document.body.appendChild(el);
	el.select();
	document.execCommand('copy');
	 document.body.removeChild(el);
};

var player_pieces = 0;
//0 - white
//1 - black

var ready_meaning = 0;
//0 - Done initializing
//1 - None
//2 - Just played a move, request board

var to_move = 0;
//0 - white
//1 - black

var is_mate = 0
//0-normal
//1-draw
//2-white mated
//3-black mated

var move_stack = [];

var legal_moves = [];

var has_bestmove = 0;
var bestmove = 0;

var FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

var board = 
[
"rnbqkbnr",
"pppppppp",
"        ",
"        ",
"        ",
"        ",
"PPPPPPPP",
"RNBQKBNR"];

function construct_board()
{
	board = [""]
	for (var i = 0; i < FEN.length; i++)
	{
		if (FEN[i] == ' ')
		{
			break;
		}
		if (FEN[i] >= '0' && FEN[i] <= '8')
		{
			for (var j = 0; j < FEN[i]; j++)
			{
				board[board.length-1] += ' ';
			}
		}
		else if (FEN[i] == '/')
		{
			board.push([""]);
		}
		else
		{
			board[board.length-1] += FEN[i];
		}
	}
	board.reverse();
}

function update_last_move()
{
	if (move_stack.length == 0)
	{
		document.getElementById("last_move").innerHTML = "A move has not yet been played.";
	}
	else
	{
		if (to_move == 0)
		{
			document.getElementById("last_move").innerHTML = "Last move was " + move_stack[move_stack.length-1] + " by black.";
		}
		else
		{
			document.getElementById("last_move").innerHTML = "Last move was " + move_stack[move_stack.length-1] + " by white.";
		}
	}
}

function update_to_move()
{
	if (to_move == 0)
	{
		document.getElementById("text_tomove").innerHTML = "White to move.";
	}
	else
	{
		document.getElementById("text_tomove").innerHTML = "Black to move.";
	}
}

function check_bot()
{
	if (to_move != player_pieces)
	{
		if (has_bestmove)
		{
			play_move(bestmove);
		}
	}
}

function update_pos()
{
	var poss = "position startpos moves ";
	for (var i = 0; i < move_stack.length; i++)
	{
		poss += move_stack[i] + " ";
	}
	console.log("STOCKFISH " + poss)
	stockfish.postMessage(poss);
	stockfish.postMessage("isready");
}

function play_move(move)
{
	has_bestmove = 0;
	to_move = 1 - to_move;
	move_stack.push(move);
	update_pos();
	ready_meaning = 2;
	update_last_move();
	update_to_move();
	check_bot();
	stockfish.postMessage("go depth 10");
}

function set_text_pieces()
{
	if (player_pieces == 0)
	{
		document.getElementById("text_pieces").innerHTML = "You are playing the white pieces.";
	}
	else
	{
		document.getElementById("text_pieces").innerHTML = "You are playing the black pieces.";
	}
}

function click_box_history()
{

}

function click_box_eval()
{
	if (document.getElementById("box_eval").checked)
	{
		document.getElementById("text_eval").style = "";
	}
	else
	{
		document.getElementById("text_eval").style = "display:none;";
	}
}

function click_button_swap()
{
	player_pieces = 1 - player_pieces;
	set_text_pieces();
	check_bot();
}


function click_button_fenclip()
{
	copyToClipboard(FEN);
}

function click_button_lichess()
{
	window.open("https://www.lichess.org/analysis/" + FEN.split(" ").join("_"))
}

function click_button_undo()
{
	for (var i = 0; i < 2; i++)
	{
		if (move_stack.length != 0)
		{
			move_stack.pop();
		}
		else
		{
			break;
		}
	}
	update_pos();
	update_last_move();
	update_to_move();
	check_bot();
}

function illegal_text_visible()
{
	document.getElementById("text_illegal").style = "color:red;"
}

function illegal_text_invisible()
{
	document.getElementById("text_illegal").style = "color:white;"
}

function illegal_move_seq()
{
	var blink = 1000;
	for (var i = 0; i < 3; i++)
	{
		setTimeout(illegal_text_visible, blink/2 + i*blink);
		setTimeout(illegal_text_invisible, blink + i*blink);
	}
}

function click_button_play()
{
	if (to_move != player_pieces)
	{
		return;
	}
	var move = document.getElementById("input_move").value;
	if (legal_moves.indexOf(move) != -1)
	{
		play_move(move);
	}
	else
	{
		if (move.length == 2)
		{
			//Pawn location
			if (move[0] >= 'a' && move[0] <= 'h' &&
				move[1] >= '1' && move[1] <= '8')
			{
				var index = -1;
				for (var i = 0; i < legal_moves.length; i++)
				{
					var m = legal_moves[i];
					var b = board[m[1]-'1'][m[0].charCodeAt(0)-'a'.charCodeAt(0)];
					if (legal_moves[i].substr(2, 2) == move &&
						(b == 'p' || b == 'P') &&
						m[3] != '1' && m[3] != '8')
					{
						if (index != -1)
						{
							index = -1;
							break;
						}
						else
						{
							index = i;
						}
					}
				}
				if (index != -1)
				{
					play_move(legal_moves[index]);
				}
				else
				{
					illegal_move_seq();
				}
			}
			//Pawn rank captures
			else if (move[0] >= 'a' && move[0] <= 'h' && move[1] == 'x')
			{
				var index = -1;
				for (var i = 0; i < legal_moves.length; i++)
				{
					var m = legal_moves[i];
					var b = board[m[1]-'1'][m[0].charCodeAt(0)-'a'.charCodeAt(0)];
					if (legal_moves[i][0] == move[0] &&
						(b == 'p' || b == 'P') && 
						legal_moves[i][0] != legal_moves[i][2] &&
						m[3] != '1' && m[3] != '8')
					{
						if (index != -1)
						{
							index = -1;
							break;
						}
						else
						{
							index = i;
						}
					}
				}
				if (index != -1)
				{
					play_move(legal_moves[index]);
				}
				else
				{
					illegal_move_seq();
				}
			}
			//Piece captures
			else if (move[0] != 'B' && move[0] != 'N' && move[0] == 'R' &&
					move[0] != 'Q' && move[1] == 'x')
			{
				var index = -1;
				for (var i = 0; i < legal_moves.length; i++)
				{
					var m = legal_moves[i];
					var b = board[m[1]-'1'][m[0].charCodeAt(0)-'a'.charCodeAt(0)].toUpperCase();
					var b2 = board[m[3]-'1'][m[2].charCodeAt(0)-'a'.charCodeAt(0)].toUpperCase();
					if (legal_moves[i][0] == move[0] &&
						b == move[0] && 
						b2 != ' ')
					{
						if (index != -1)
						{
							index = -1;
							break;
						}
						else
						{
							index = i;
						}
					}
				}
				if (index != -1)
				{
					play_move(legal_moves[index]);
				}
				else
				{
					illegal_move_seq();
				}
			}
			else
			{
				illegal_move_seq();
			}
		}
		else if (move.length == 3)
		{
			//Piece and location
			if (move[1] >= 'a' && move[1] <= 'h' &&
				move[2] >= '1' && move[2] <= '8')
			{
				if (move[0] != 'B' && move[0] != 'N' && move[0] == 'R' &&
					move[0] != 'Q')
				{
					illegal_move_seq();
					return;
				}
				var index = -1;
				for (var i = 0; i < legal_moves.length; i++)
				{
					var m = legal_moves[i];
					var b = board[m[1]-'1'][m[0].charCodeAt(0)-'a'.charCodeAt(0)];
					if (legal_moves[i].substr(2, 2) == move.substr(1, 2) &&
						(b.toUpperCase() == move[0]))
					{
						if (index != -1)
						{
							index = -1;
							break;
						}
						else
						{
							index = i;
						}
					}
				}
				if (index != -1)
				{
					play_move(legal_moves[index]);
				}
				else
				{
					illegal_move_seq();
				}
			}
			//Location captures
			else if (move[0] >= 'a' && move[0] <= 'h' &&
					move[1] >= '1' && move[1] <= '8' && move[2] == 'x')
			{
				var index = -1;
				for (var i = 0; i < legal_moves.length; i++)
				{
					var m = legal_moves[i];
					var b = board[m[1]-'1'][m[0].charCodeAt(0)-'a'.charCodeAt(0)];
					if (legal_moves[i].substr(2, 2) == move.substr(0, 2) && b != ' ')
					{
						if (index != -1)
						{
							index = -1;
							break;
						}
						else
						{
							index = i;
						}
					}
				}
				if (index != -1)
				{
					play_move(legal_moves[index]);
				}
				else
				{
					illegal_move_seq();
				}
			}
		}
		//Castle kingside
		else if (move == "O-O")
		{
			var index = -1;
			for (var i = 0; i < legal_moves.length; i++)
			{
				if (legal_moves[i] == "e1g1" || legal_moves[i] == "e8g8")
				{
					play_move(legal_moves[i]);
					index = i;
				}
			}
			if (index == -1)
			{
				illegal_move_seq();
			}
		}
		//Castle queenside
		else if (move == "O-O-O")
		{
			var index = -1;
			for (var i = 0; i < legal_moves.length; i++)
			{
				if (legal_moves[i] == "e1c1" || legal_moves[i] == "e8c8")
				{
					play_move(legal_moves[i]);
					index = i;
				}
			}
			if (index == -1)
			{
				illegal_move_seq();
			}
		}
	}
}

function click_button_new()
{
	move_stack = [];
	legal_moves = [];
	is_mate = 0;
	has_bestmove = 0;
	FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
	stockfish.postMessage("uncinewgame");
	stockfish.postMessage("position startpos");
	stockfish.postMessage("isready");
	document.getElementById("text_eval").innerHTML = "Evaluation: 0";
	update_last_move();
	update_to_move();
	check_bot();
	stockfish.postMessage("go depth 5");
}

function label_change_depth()
{
	stockfish.postMessage("setoption name Skill Level value " + document.getElementById("label_diff").value);
}

var stockfish = STOCKFISH();
stockfish.postMessage("ucinewgame");
stockfish.postMessage("position startpos");
stockfish.postMessage("d");
stockfish.postMessage("eval");
stockfish.onmessage = function(event) {
	console.log(event.data ? event.data : event);
	var d = event.split(":")
	var w = event.split(" ")
	if (d[0] == "readyok")
	{
		if (ready_meaning == 0)
		{
			ready_meaning = 1;
			document.getElementById("div_main").style.display = "grid";
			document.getElementById("h2_init").style.display = "none";
			stockfish.postMessage("setoption name Skill Level value " + document.getElementById("label_diff").value);
		}
		if (ready_meaning == 2)
		{
			stockfish.postMessage("d");
		}
	}
	if (d[0] == "Legal uci moves")
	{
		legal_moves = d[1].split(" ");
		legal_moves.remove("");
	}
	/*if (d[0] == "Total evaluation")
	{
		document.getElementById("text_eval").innerHTML = "Evaluation: " + d[1];
	}*/
	if (d[0] == "Fen")
	{
		FEN = d[1];
		FEN = FEN.substr(1, FEN.length-1);
		construct_board();
	}
	if (w[0] == "bestmove")
	{
		has_bestmove = 1;
		bestmove = w[1];
		if (w[1] == "(none)")
		{
			is_mate = 1;
		}
		if (to_move != player_pieces)
		{
			play_move(bestmove);
		}
	}
	if (w[0] == "info")
	{
		for (var i = 0; i + 2 < w.length; i++)
		{
			if (w[i] == "score" && w[i+1] == "cp")
			{
				var ad = w[i+2]/100.0;
				if (to_move)
				{
					ad = -ad;
				}
				if (ad > 0)
				{
					ad = "+"+ad;
				}
				document.getElementById("text_eval").innerHTML = "Evaluation: " + ad + " (for white)";
			}
		}
	}
};

stockfish.postMessage("isready");
label_change_depth();
stockfish.postMessage("go depth 5");
