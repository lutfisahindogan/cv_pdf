function barra() {
	return $('#barra-edicion-template').html();
}

function mostrar_popup_e_ir_arriba(titulo, plantilla) {
	parent.ir_arriba = true;
	bootbox.dialog({
        title  : titulo,
        message: plantilla
    });
}

function insertTextAtCursor(text) {
    var sel, range, html;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode( document.createTextNode(text) );
        }
    } else if (document.selection && document.selection.createRange) {
        document.selection.createRange().text = text;
    }
}

$('[contenteditable]').on('paste',function(e) {
    e.preventDefault();

    var text = '';

    if (e.clipboardData || e.originalEvent.clipboardData) {
      text = (e.originalEvent || e).clipboardData.getData('text/plain');
    } else if (window.clipboardData) {
      text = window.clipboardData.getData('Text');
    }

    var $result = $('<div></div>').append(text);
    // remove unnecesary tags (if paste from word)
	$result.children('style').remove();
	$result.children('meta').remove()
	$result.children('link').remove();
	insertTextAtCursor($result.text());
});

$('#hojas').on('DOMNodeInserted', function(e) {
	var elem = $(e.target);
    if (elem.hasClass('barra') && !elem.hasClass('barrado')) {
    	elem.addClass('barrado');
		elem.prepend(barra());
    }
    var els = $('.barra-quill', elem);
    if (els.length > '') {
    	poner_barra_editor(els[0]);
    }
    convertirSVG(elem);
});

function poner_barra_editor(el) {
	new Quill(el, {
		modules: {
			toolbar: [
				['bold', 'italic', 'underline'],
				[{'list': 'ordered'}, {'list': 'bullet'}],
				['clean']
			]
		},
		theme: 'bubble'
	});
}

function convertirSVG($svg) {
    if ($svg.hasClass("svg")) {
		$svg.attr("data-tooltip", 0);
	}
}

function load() {
	$('#guardar').html($('#guardar').data('texto'));
	$('#descargar').html($('#descargar').data('texto'));
	$('#info_fieldset').prop("disabled", false);
	var boton = $('<span><i class="fa fa-cog" aria-hidden="true"></i></span>').addClass('cerrar');
  	$('.sidebar-pdf').prepend(boton);

  	var els = $('.barra-quill');
    for (var i = els.length - 1; i >= 0; i--) {
    	poner_barra_editor(els[i]);
    }

	$(document).on('keypress', function() {
	    comprobarAlturasPorInsercion();
	});

	$(document).on('keyup', function(e) {
	    if (e.keyCode == 46 || e.keyCode == 8) {
	        comprobarAlturasPorBorrado();
	    }
	});

	$('body').off().on('click', '.icono.expandible', function(e) {
		var elem = $(e.target).closest('.barra');
		var plantilla = elem.attr('data-template');
		var id = elem.attr('data-id');
		$('div[data-id=' + id + ']:first .contenido-seccion').prepend($('#' + plantilla).html());
		comprobarAlturasPorInsercion();
	});

	$('body').on('click', '.resetear-boton', function(e) {
		e.preventDefault();
		$('#form-resetear').submit();
	});

	$('body').on('click', '.icono.borrable', function(e) {
		var elem   = $(e.target).closest('.barra');
		if (elem.is('[data-nombre]')) {
			var id  = elem.attr('data-id');
			var col = elem.attr('data-columna');
			$('.columna' + col + ' [data-id=' + id + ']').remove();
			$('.sidebar-pdf .secciones li[data-id=' + id + '] input').prop('checked', false);
		} else {
			elem.remove();
		}
		comprobarAlturasPorBorrado();
	});
	
	/*$('body').on('blur', '[contenteditable=true]', function() {
		var texto = $(this).html();
		texto = texto.trim().replace(/<br>/g, '\n').trim();
		texto = $('<div></div>').html(texto).text().trim();
		texto = texto.trim().replace(/\n/g, '<br>');
    	$(this).html(texto);
	});*/

	$('body').on('click', '.icono.arriba', function(e) {
		$(e.target).closest('.barra').addClass('ancla');
		juntar();
		var elem = $('.ancla');
		elem.removeClass('ancla');
		var destino = elem.prev();
		if (destino.length > 0) {
			elem.insertBefore(destino); // mover sección
		}
		comprobarAlturasPorInsercion();
		comprobarAlturasPorBorrado();
		quitarBarras();
	});

	function juntar() {
		var elems = $('.seccion.barra');
		for (var j = 0; j < elems.length; j++) {
			var elem      = $(elems[j]);
			var dataId    = elem.attr('data-id');
			var contenido = $('.contenido-seccion', elem);
			var partes    = $('.seccion[data-id=' + dataId + ']').not('.barra');
			var bloques   = $('.contenido-seccion', partes).children();
			for (var i = 0; i < bloques.length; i++) {
				var bloque = $(bloques[i]);
				bloque.detach().appendTo(contenido);
			}
			partes.remove(); // borrar secciones sin barra vacía
		}
	}

	function quitarBarras() {
		var secciones = $('.seccion');
		for (var i = 0; i < secciones.length; i++) {
			var seccion = $(secciones[i]);
			var id = seccion.data('id');
			var partes = $('.seccion.barra[data-id=' + id + ']');
			for (var j = 1; j < partes.length; j++) {
				var parte = $(partes[j]);
				parte.attr('class', 'seccion');
			}
		}
	}

	$('body').on('click', '.icono.abajo', function(e) {
		$(e.target).closest('.barra').addClass('ancla');
		juntar();
		var elem = $('.ancla');
		elem.removeClass('ancla');
		var destino = elem.next();
		if (destino.length > 0) {
			elem.insertAfter(destino);	
		}
		comprobarAlturasPorInsercion();
		comprobarAlturasPorBorrado();
		quitarBarras();
	});

	$('body').on('click', '.sidebar-pdf .secciones input', function(e) {
		var input = $(e.target);
		var e     = input.closest('li');
		var col   = e.attr('data-columna');
		var id    = e.attr('data-id');
		if (input.is(":checked")) {
			if ($('.columna' + col + ' .seccion[data-id=' + id + ']').length == 0) {
				var seccion = $($('#' + id + '-template').html());
				$('.columna' + col + ':last').append(seccion);
				$('.expandible', seccion).click();
			}
			comprobarAlturasPorInsercion();
		} else {
			$('.columna' + col + ' [data-id=' + id + ']').remove();
			$('.sidebar-pdf .secciones li[data-id=' + id + '] input').prop('checked', false);
			comprobarAlturasPorBorrado();
		}
	});

	$('[data-ocultable]').on('click', function(e) {
		var id = $(this).data('ocultable');
		$('[data-ocultable]').each(function() {
			var e = $(this).data('ocultable');
			$('#' + e).addClass('hide');
		});
		$('#' + id).removeClass('hide');
	});

	$('body').on('click', '.sidebar-pdf .elementos input', function(e) {
		var input = $(e.target);
		var e     = input.closest('li');
		var id    = e.attr('data-id');
		var ele   = $($('[data-elemento=' + id+ ']')[0]);
		if (input.is(":checked")) {
			ele.data('valor', 'on');
			ele.removeClass('off');
			ele.addClass('on');
		} else {
			ele.data('valor', 'off');
			ele.removeClass('on');
			ele.addClass('off');
		}
	});

	$('body').on('click', '.sidebar-pdf .colores li', function(e) {
		color    = $(e.target).attr('data-color');
		$($('.info_color')[0]).val(color);
		var ruta = '/assets/plantillas/pdf/' + nombre_plantilla + '/css/color_' + color + '.css';
		$('link#csscolores').attr('href', ruta);
	});

	$('body').on('click', '.imagen.selector', function(e) {
		var el  = $('svg', $(this));
		$('[data-activo=true]').attr('data-activo', 'false');
		el.attr('data-activo', 'true');
		var tooltip = $('div[data-tooltip=' + el.data('tooltip') + ']');
		var linkPosition = el.position();
		tooltip.css({
			top : linkPosition.top  + tooltip.outerHeight(),
			left: linkPosition.left
		});
		tooltip.addClass("active");
	});

	$('body').on('click', '.tooltip svg', function(e) {
		var img = $(e.target);
		if (img.prop("tagName") == 'path') {
			img = img.closest('svg');
		}
		var tooltip = img.closest('.tooltip');
		var svg = $('svg[data-activo=true');
		svg.replaceWith(img.clone());
		tooltip.addClass("out");
		
		setTimeout(function() {
        	tooltip.removeClass("active").removeClass("out");
        }, 300);
	});

	$('.sidebar-pdf .cerrar').on('click', function() {
		var el     = $('.sidebar-pdf .barra-sidebar');
		var cerrar = $('.sidebar-pdf .cerrar');
		if (el.is(':visible')) {
			el.hide();
		} else {
			el.show();
		}
	});

	$('body').on('paste', '.bloque', function(e) {
		comprobarAlturasPorInsercion();
	});

	var pavara = $('.sidebar-pdf .colores');
	for (var i = 0; i < colores.length; i++) {
		var color = colores[i];
		var li    = $('<li></li>').attr('data-color', color);
		if (color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)) {
			color = '#' + color;
		}
		li.css('background-color', color);
		pavara.append(li);
	}

	var aBarrar = $('.barra');
	for (var i = 0; i < aBarrar.length; i++) {
		var elem = $(aBarrar[i]);
    	elem.addClass('barrado');
		elem.prepend(barra());
    }

    $('<div class="tooltip" data-tooltip="0">'+$('#lista-iconos').html()+'</div>').appendTo("body")

    var interruptor = $('<label class="input-toggle"><input type="checkbox" checked><span></span></label>');
    $('.sidebar-pdf .secciones li, .sidebar-pdf .elementos li').each(function() {
    	$(this).append(interruptor.clone());
    });

    var secciones = $('.sidebar-pdf .secciones li');
    for (var i = 0; i < secciones.length; i++) {
    	var seccion = $(secciones[i]);
    	var dataId  = seccion.data('id');
    	if ($('.seccion[data-id=' + dataId + ']').length == 0) {
    		$('input', seccion).prop('checked', false);
    	}  else {
    		$('input', seccion).prop('checked', true);
    	}
    }

    $('body').on('click', '.puntos li', function(e) {
    	var li = $(this);
    	var valor = li.data('valor')
    	var ul = li.closest('ul');
    	var tope = $(ul).data('valor').split('/')[1];
    	ul.attr('data-valor', valor + "/" + tope);
    	var is = $('li i', ul);
    	for (var i = 1; i <= is.length; i++) {
    		var e = $(is[i-1]);
    		if (i <= valor) {
    			e.attr('class', ul.data('class1'));
    		} else {
				e.attr('class', ul.data('class2'));
    		}
    	}
    });

    var elementos = $('.sidebar-pdf .elementos li');
    for (var i = 0; i < elementos.length; i++) {
    	var elemento = $(elementos[i]);
    	var dataId  = elemento.data('id');
    	if ($('[data-elemento=' + dataId + '][data-valor]').hasClass('off')) {
    		$('input', elemento).prop('checked', false);
    	}  else {
    		$('input', elemento).prop('checked', true);
    	}
    }

    $('a.plantilla-preview').click(function(e) {
    	e.preventDefault();
    	var self = $(this);
		guardarAjax(function() {
			cambiarPlantilla(self);
    	});
    });

    function comprobarPlantilla(self) {
    	nombre_plantilla = self.data('plantilla');
    	$.ajax({
			dataType: "json",
			url: '/~/existePlantilla/' + self.data('plantillaid'),
			success: function(e) {
			  	if (e) {
					cambioPlantilla(0);
			  	} else {
			  		var titulo    = '';
					var plantilla = $('#plantilla-popup-datos').html();
					mostrar_popup_e_ir_arriba(titulo, plantilla);
			  	}
			}
		});
    }

    function cambiarPlantilla(self) {
    	var plantillaGratis = self.data('gratis');
    	if (usuarioPreimum || plantillaGratis) {
	    	comprobarPlantilla(self);
    	} else {
    		var titulo    = $('#plantilla-popup-premium').data('titulo');
			var plantilla = $('#plantilla-popup-premium').html();
			mostrar_popup_e_ir_arriba(titulo, plantilla);
		    $('#cambio-plantilla').click(function(e) {
		    	e.preventDefault();
		    	comprobarPlantilla(self);
		    });
    	} 
    }

    comprobarAlturasPorInsercion();
    if (primero) {
    	guardar(false);
    }
    $('body').on('click', 'a#cambio-plantilla-2', function(e) {
		e.preventDefault();
		cambioPlantilla($("input[name='opcion']:checked").val());
	});

	$('body').on('click', 'a#cerrar-popup-ads', function(e) {
		e.preventDefault();
	});
}

function cambioPlantilla(exportacion) {
	var form = $('#form_guardar');
	form.attr('action', form.data('guardar'));
	$('.info_nueva').val('true');
	$('.info_exportacion').val(exportacion);
	guardar();
}

$(document).ready(load);

function crearHoja() {
	var hoja = $('#hoja');
	$('#hojas').append(hoja.html());
	return hoja;
}

function alturaSeccionSinBloques(seccion) {
	var data_id = seccion.attr('data-id');
	var seccion = $('.seccion[data-id=' + data_id + ']:first');
	var altura  = seccion.outerHeight(true);
	if ($('.unico', seccion).length == 0) {
		var bloques = $('.bloque', seccion);
		for (var i = 0; i < bloques.length; i++) {
			var bloque = $(bloques[i]);
			altura -= bloque.outerHeight(true);
		}
	}	
	return altura;
}

function comprobarAlturasPorBorradoPorColumna(num_columna) {
	var columnas = $('.columna' + num_columna);
	// Mover bloques
	for (var i = 1; i < columnas.length; i++) {
		var columna = $(columnas[i]);
		var bloque  = $('.bloque:first', columna);
		if (bloque.length == 0) continue;
		var seccion    = bloque.closest('.seccion');
		var seccionA   = seccionAnterior(seccion, i);
		var altoBloque = $('.unico', $(seccion)).length > 0 ? 0 : bloque.height();
		if (!seccionA) {
			var data_id     = seccion.attr('data-id');
			var altoSeccion = alturaSeccionSinBloques(seccion);
			var altoMover   = altoBloque + altoSeccion;
			if (espacioLibre(i - 1, num_columna) > altoMover) {
				var destino = $('.columna' + num_columna + ':nth(' + (i - 1) + ')');
				seccion.detach().appendTo(destino);
				return 1;
			}
		} else if (espacioLibre(i - 1, num_columna) > altoBloque) {
			var destino = $('.contenido-seccion', seccionA);
			bloque.detach().appendTo(destino);
			return 1;
		}
		if (mismaSeccionAnterior(i, num_columna)) {
			if (entraBloqueEnColumna(i - 1, num_columna, bloque)) {
				moverColumnaAanterior(i, num_columna);
				return 1;
			}
		}
	}
	// Eliminar secciones sin barra ni bloques, 
	// eliminar de secciones todo menos contenido de secciones con barra si es que hay más de una y 
	// mover secciones vacías si entran
	for (var i = 1; i < columnas.length; i++) {
		var columna = $(columnas[i]);
		var seccion = $('.seccion:first', columna);
		if (seccion.length == 0) continue;
		if (seccionSinBarraNiBloques(seccion[0])) {
			seccion[0].remove();
			return 1;
		}
		if (seccionVacia(seccion) && entra(seccion, i - 1, num_columna)) {
			var destino = $('.columna' + num_columna + ':nth(' + (i - 1) + ')');
			seccion.detach().appendTo(destino);
			return 1;
		}
	}
	// Eliminar hojas vacías
	borrarHojasVacias();
	return 0;
}

function entra(elemento, hoja, columna) {
	return elemento.outerHeight(true) < espacioLibre(hoja, columna);
}

function espacioLibre(hoja, n_columna) {
	var zona    = $('.columna' + n_columna + ':nth(' + hoja + ')');
	var altoUso = altura(zona);
	var altoCol = hoja == 0 ? altura1 : alturan;
	return altoCol - altoUso;
}

function seccionVacia(seccion) {
	return $('.bloque', seccion).length == 0 && $('h1', seccion).length > 0;
}

function seccionAnterior(seccion, hoja) {
	var id  = seccion.attr('data-id');
	var aux = $('.cv-pdf:nth(' + (hoja - 1) + ') .seccion[data-id=' + id + ']');
	return aux.length > 0 ? aux : false;
}

function seccionSinBarraNiBloques(seccion) {
	var barra   = $('h1', seccion);
	var bloques = $('.bloque', seccion);
	return barra.length == 0 && bloques.length == 0;
}

function borrarHojasVacias() {
	var nHojas = $('.cv-pdf').length;
	for (var i = 1; i < nHojas; i++) { // iterar sobre todas las hojas
		var n = 0;
		for (var j = 1; j <= nColumnas; j++) {  // mirar todas las columnas de cada hoja
			if ($($('.cv-pdf .columna' + j)[i]).children().length == 0) {
				n++;
			}
		}	
		if (n == nColumnas) {
			$('.cv-pdf:nth(' + i + ')').remove();
		}
	}
}

function comprobarAlturasPorBorrado() {
	var cambios = 0;
	for (var i = 1; i <= nColumnas; i++) { // columnas
		cambios += comprobarAlturasPorBorradoPorColumna(i);
	}
	if (cambios) {
		comprobarAlturasPorBorrado();
		comprobarAlturasPorInsercion();
	}
}

function mismaSeccionAnterior(hoja, columna) {
	var seccion1 = $('.columna' + columna + ':nth(' + (hoja - 1) + ') .seccion:last');
	var seccion2 = $('.columna' + columna + ':nth(' + hoja + ') .seccion:first');
	return seccion1.attr('data-id') == seccion2.attr('data-id');
}

function moverColumnaAanterior(hoja, columna) {
	var seccion = $('.columna' + columna + ':nth(' + hoja + ') .seccion:first');
	var bloque  = $('.bloque:first', seccion);
	var destino = $('.columna' + columna + ':nth(' + (hoja - 1) + ') .contenido-seccion:last');
	bloque.detach().appendTo(destino);
	if ($('.bloque', seccion).length == 0) {
		seccion.remove();
	}
}

function entraBloqueEnColumna(hoja, n_columna, bloque) {
	if (bloque.length > 0) {
		bloque = bloque[0];
	}
	bloque = $(bloque);
	var columna       = $('.columna' + n_columna + ':nth(' + hoja + ')')[0];
	var alturaBloque  = bloque.outerHeight(true);
	var alturaMaxima  = hoja == 0 ? altura1 : alturan;
	var alturaColumna = altura(columna);
	return alturaColumna + alturaBloque < alturaMaxima;
}

function altura(elemento) {
	if (elemento.length > 0) {
		elemento = elemento[0];
	}
	elemento = $(elemento);
	var elementos = $('.seccion', elemento);
	var altura = 0;
	for (var i = 0; i < elementos.length; i++) {
		altura = altura + $(elementos[i]).outerHeight(true);
	}
	var padding = parseInt(elemento.css('padding-top')) + parseInt(elemento.css('padding-bottom'));
	var margin  = parseInt(elemento.css('margin-top')) + parseInt(elemento.css('margin-bottom'));

	var cabecera = $('.cabecera', elemento);
	if (cabecera && cabecera.length > 0) {
		altura = altura + $(cabecera[0]).outerHeight();
	}
	return altura + padding + margin;
}

function comprobarAlturasPorInsercion() {
	var hojas = $('.cv-pdf');
	var i, cambios = 0;

	for (var j = 1; j <= nColumnas; j++) {
		var columnas = $('.columna' + j);
		for (i = 0; i < columnas.length && !isOverflown(columnas[i], i); i++);
		if (i < columnas.length) {
			cambios += moverColumnaAsiguiente(j, i);
		}
	}
	if (cambios > 0) {
		comprobarAlturasPorInsercion();
	}
}

function moverColumnaAsiguiente(columna, n) {
	var seccion      = $('.columna' + columna + ':nth(' + n + ') > .seccion:last-of-type');
	if (seccion.length == 0) return;
	var dataId       = seccion.attr('data-id');
	var dataTemplate = seccion.attr('data-template');
	var bloque       = $('.bloque:last-of-type', seccion);
	var hoja         = $('.cv-pdf:nth(' + (n + 1) +') .columna' + columna);
	var cambios      = 0;
	if (hoja.length == 0) {
		crearHoja();
	}
	var destino = $('.cv-pdf:nth(' + (n + 1) +') .columna' + columna + ' [data-id=' + dataId + '] .contenido-seccion');
	if (destino.length == 0) {
		var nuevaSeccion = $('<div></div>');
		nuevaSeccion.attr('data-id', dataId).attr('data-template', dataTemplate).addClass(seccion.attr('class'));
		var contenido = $('.contenido-seccion', seccion);
		if (contenido.length == 0) return 0;
		var etiqueta = contenido.prop('tagName').toLowerCase();
		var contenidoSeccion = $('<' + etiqueta +'></' + etiqueta + '>').addClass('contenido-seccion').prependTo(nuevaSeccion);
		if ($('.unico', seccion).length > 0) {
			contenidoSeccion.addClass('unico');
		} 
		destino = $('.cv-pdf:nth(' + (n + 1) +') .columna' + columna);
		nuevaSeccion.prependTo(destino);
		destino = contenidoSeccion;
		cambios = 1;
	}
	bloque.detach().prependTo(destino);
	cambios += 1;
	seccion = $('.columna' + columna + ':nth(' + n + ') .seccion:last');
	if ($('.bloque', seccion).length == 0) { // se ha quedado título de sección en una hoja?
		var elementos = seccion.children().not('.contenido-seccion');
		var clases    = seccion.attr('class');
		elementos.prependTo(destino.parent());
		seccion.remove();
		elementos.closest('.seccion').attr('class', clases);
	}
	return cambios;
}

function isOverflown(element, numHoja) {
	if (numHoja == 0) {
		return altura(element) > altura1;
	} else {
		return altura(element) > alturan;
	}
}

function aJson() {
	var json      = [];
	var cabecera  = {};
	var elementos = {};
	var infos     = $('.cabecera [data-info]');
	for (var i = 0; i < infos.length; i++) {
		var info = $(infos[i]);
		var attr = info.attr('data-attr');
		if (attr) {
			cabecera[info.attr('data-info')] = info.attr(attr);
		} else {
			cabecera[info.attr('data-info')] = info.text().trim();
		}
	}
	var elems = $('[data-elemento]');
	for (var i = 0; i < elems.length; i++) {
		var elemento = $(elems[i]);
		var nombre   = 'elemento'+elemento.data('elemento');
		var valor    = elemento.data('valor');
		elementos[nombre] = valor;
	}
	cabecera['elementos'] = elementos;
	var hojas = $('.cv-pdf');
	for (var i = 0; i < hojas.length; i++) {
		var hoja = hojas[i];
		var jhoja = { };
		for (var ncol = 1; ncol <= nColumnas; ncol++) {
			jhoja['columna' + ncol] = [];
			var columna = $('.columna' + ncol, hoja);
			var secciones = $('.seccion', columna);
			for (var j = 0; j < secciones.length; j++) {
				var seccion  = $(secciones[j]);
				var jseccion = { 
					'data-id'      : seccion.attr('data-id'),
					'data-template': seccion.attr('data-template'),
					'titulo'       : $('h1', seccion).text(),
					'cabecera'     : $('h1', seccion).length > 0,
					'bloques'      : []
				};
				// data-info a nivel de seccion única
				var infos = $('.unico [data-info]', seccion);
				for (var l = 0; l < infos.length; l++) {
					var info = $(infos[l]);
					var attr = info.attr('data-attr');
					if (attr) {
						var str = info.attr(attr);
						if (str.substring(0, 1) == '/') { 
							str = str.substring(1);
						}
						jseccion[info.attr('data-info')] = eliminar_espacios(str);
					} else {
						var textoConFormato = $('.ql-editor', info);
						if (textoConFormato.length > 0) {
							str = textoConFormato[0].innerHTML;
						} else {
							str = info.html();
						}
						jseccion[info.attr('data-info')] = eliminar_espacios(str);
					}
				}
				// bloques
				var bloques = $('.bloque', seccion);
				for (var k = 0; k < bloques.length; k++) {
					var bloque = bloques[k];
					var jbloque = {};
					var infos = $('[data-info]', bloque);
					for (var l = 0; l < infos.length; l++) {
						var info = $(infos[l]);
						var attr = info.attr('data-attr');
						if (attr) {
							var str = info.attr(attr);
							if (str.substring(0, 1) == '/') { 
								str = str.substring(1);
							}
							jbloque[info.attr('data-info')] = eliminar_espacios(str);
						} else {
							var textoConFormato = $('.ql-editor', info);
							if (textoConFormato.length > 0) {
								str = textoConFormato[0].innerHTML;
							} else {
								str = info.html();
							}
							jbloque[info.attr('data-info')] = eliminar_espacios(str);
						}
					}
					jseccion.bloques.push(jbloque);
				}
				jhoja['columna' + ncol].push(jseccion);
			}
		}
		if (i == 0) {
			jhoja['cabecera'] = cabecera;
		}
		json.push(jhoja);
	}
	return json;
}

function eliminar_espacios(texto) {
	return texto.replace(/(<p>\s*(<br>)*\s*<\/p>\s*)+$/gi, '').trim();
}

$('#guardar').on('click', function(e) {
	e.preventDefault();
	$(this).prop("disabled",true);
	var form = $('#form_guardar');
	form.attr('action', form.data('guardar'));
	guardar();
});

function guardar() {
	var json = aJson();
	var form = $('#form_guardar');
	$('.info_json').val(JSON.stringify(json));	
	$('.info_js').val(true);	
	$('.info_plantilla').val(nombre_plantilla);
	form.submit();	
}

function guardarAjax(a) {
	var json = aJson();
	var form = $('#form_guardar');
	$('.info_json').val(JSON.stringify(json));	
	$('.info_plantilla').val(nombre_plantilla);

	$.ajax({
       type: "POST",
       url: form.data('guardar')+'-ajax',
       data: form.serialize(), 
       success: a
    });
}

$('#descargar').on('click', function(e) {
	e.preventDefault();
	if (puedeDescargar) {
		var form = $('#form_guardar');
		form.attr('action', form.data('descargar'));
		guardar();
	} else {
		guardarAjax(function(data) {
			var titulo    = $('#plantilla-popup-descargar').data('titulo');
			var plantilla = $('#plantilla-popup-descargar').html();
			mostrar_popup_e_ir_arriba(titulo, plantilla);
		});
	}
});

$('a#link-resetear').on('click', function(e) {
	e.preventDefault();
	var titulo    = $('#resetear-popup').data('titulo');
	var plantilla = $('#resetear-popup').html();
	mostrar_popup_e_ir_arriba(titulo, plantilla);
});