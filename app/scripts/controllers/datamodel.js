'use strict';

(function() {

	var elements = function(elements) {
		var results = [];
		angular.forEach(elements, function(element) {
			results.push(factory(element));
		});
		return results;
	};

	var factory = function(element) {
		switch (element[0]) {
			case 'markdown':
				return new Markdown(element);
			case 'blockquote':
				return new Blockquote(element);
			case 'header':
				return new Header(element);
			case 'bulletlist':
				return new Bulletlist(element);
			case 'listitem':
				return new Listitem(element);
			case 'para':
				return new Para(element);
			case 'em':
				return new Em(element);
		}
		return new Empty(element);
	};

	var Colomn = function(item) {
		this.pk = item.hasEm();
		this.fk = item.link();
		this.values = item.text();
		this.item = item;
		if (this.fk) {
			this.toFKHtml = 'FK(' + this.fk.ref + ')';
		}
	};

	var Table = function() {
		this.name = null;
		this.comment = null;
		this.colomns = [];
	};

	var Visitor = (function() {
		var Visitor = function() {
			this.currentTable = null;
			this.tables = [];
		};
		var p = Visitor.prototype;
		p.visit = function(element) {
			//			console.log(element);
			var tag = element.type;
			switch (tag) {
				case 'markdown':
					this.markdown(element);
					break;
				case 'blockquote':
					this.blockquote(element);
					break;
				case 'header':
					this.header(element);
					break;
				case 'bulletlist':
					this.bulletlist(element);
					break;
				case 'listitem':
					this.listitem(element);
					break;
			}
		};
		p.createTable = function() {
			var table = new Table();
			this.tables.push(table);
			this.currentTable = table;
			return table;
		};

		p.markdown = function(element) {
			var self = this;
			angular.forEach(element.values, function(value) {
				var e = factory(value);
				e.accept(self);
			});
		};

		p.blockquote = function(element) {
			var table = this.createTable();
			table.comment = element.comment;
		};
		p.header = function(element) {
			if (this.currentTable === null || this.currentTable.name) {
				this.createTable();
			}
			var table = this.currentTable;
			table.name = element;

		};
		p.bulletlist = function(element) {
			var self = this;
			angular.forEach(element.items, function(item) {
				item.accept(self);
			});
		};
		p.listitem = function(element) {
			var table = this.currentTable;
			table.colomns.push(new Colomn(element));
		};
		return Visitor;
	})();

	var Element = (function() {
		var Element = function(values) {
			if (!values) {
				return;
			}
			this.element = values;
			this.type = values[0];
			this.values = values.slice(1, values.length);
		};
		var p = Element.prototype;
		p.accept = function(visitor) {
			// console.log(this, visitor);
			visitor.visit(this);
		};
		return Element;
	})();

	/*jshint unused:false*/
	var Empty = (function() {
		var Empty = function(value) {
			this.value = value;
		};
		var p = Empty.prototype = new Element();
		p.accept = function(visitor) {
			console.error(visitor, this);
		};
		return Empty;
	})();

	var Markdown = (function() {
		var Markdown = function(value) {
			Element.apply(this, [value]);
		};
		var p = Markdown.prototype = new Element();
		return Markdown;
	})();

	var Para = (function() {
		var Para = function(value) {
			Element.apply(this, [value]);
		};
		var p = Para.prototype = new Element();
		return Para;
	})();

	var Header = (function() {
		var Header = function(value) {
			Element.apply(this, [value]);
		};
		var p = Header.prototype = new Element();
		return Header;
	})();

	var Blockquote = (function() {
		var Blockquote = function(value) {
			Element.apply(this, [value]);
			this.comment = elements(this.values);
		};
		var p = Blockquote.prototype = new Element();
		return Blockquote;
	})();


	var Em = (function() {
		var Em = function(value) {
			Element.apply(this, [value]);
		};
		var p = Em.prototype = new Element();
		return Em;
	})();

	var Bulletlist = (function() {
		var Bulletlist = function(value) {
			Element.apply(this, [value]);
			this.items = elements(this.values);
		};
		var p = Bulletlist.prototype = new Element();
		return Bulletlist;
	})();
	/*jshint unused:true*/


	var Listitem = (function() {
		var Listitem = function(value) {
			Element.apply(this, [value]);
		};
		var p = Listitem.prototype = new Element();
		p.link = function() {
			if (angular.isArray(this.values[0])) {
				if (this.values[0][0] === 'link') {
					return this.values[0][1];
				}
				if (this.values[0][0] === 'link_ref') {
					return this.values[0][1];
				}
				if (this.values[0][0] === 'em') {
					var em = this.values[0][1];
					if (angular.isArray(em)) {
						return em[1];
					}
					return null;
				}
			}
		};
		p.hasEm = function() {
			if (angular.isArray(this.values[0])) {
				if (this.values[0].length === 2) {
					if (this.values[0][0] === 'em') {
						return true;
					}
				}
				if (this.values[0].length === 3) {
					if (this.values[0][0] === 'link') {
						if (this.values[0][2].length === 2) {
							if (this.values[0][2][0] === 'em') {
								return true;
							}
						}
					}
				}
			}
			return false;
		};
		p.text = function() {
			if (angular.isArray(this.values[0])) {
				if (this.values[0][0] === 'link') {
					return this.values[0][2];
				}
				if (this.values[0][0] === 'link_ref') {
					return this.values[0][1].ref;
				}
				if (this.values[0][0] === 'em') {
					var em = this.values[0][1];
					if (angular.isArray(em)) {
						return em[1].ref;
					}
					return em;
				}
			} else {
				return this.values[0];
			}
		};
		return Listitem;
	})();

	angular.module('d3App')
		.controller('DatamodelCtrl', function($scope, $http) {
		$scope.datamodel = '';
		var local = localStorage.datamodel;
		if (local.trim().length !== 0) {
			$scope.datamodel = localStorage.datamodel;
		} else {
			$http.get('/data/datamodel.md')
				.success(function(data) {
				$scope.datamodel = data;
			});
		}

		$scope.$watch('datamodel', function() {
			localStorage.datamodel = $scope.datamodel;
			var tree = markdown.parse($scope.datamodel);
			var element = factory(tree);
			var visitor = new Visitor();
			visitor.visit(element);

			if (visitor.tables.length <= 2) {
				return;
			}

			var links = [];
			var nodes = [];
			var colomns = [];
			var colomnHash = {};
			angular.forEach(visitor.tables, function(table) {
				nodes.push({
					name: markdown.toHTML(table.name.values)
				});
				var tableId = nodes.length - 1;
				angular.forEach(table.colomns, function(colomn) {
					var colomnName = colomn.values.toString().trim().toUpperCase();
					var targetId = null;
					if (colomnHash[colomnName] !== undefined) {
						targetId = colomnHash[colomnName];
					} else {
						colomns.push({
							name: colomnName
						});
						targetId = colomns.length - 1;
						colomnHash[colomnName] = targetId;
					}
					links.push({
						source: tableId,
						target: targetId,
						pk: colomn.pk,
						fk: colomn.fk,
						value: 1
					});
				});
			});

			console.log(colomnHash);

			$('svg').children().remove();
			var x = 30;
			var svg = d3.select('svg#models');
			var texts = svg.selectAll('text');
			texts.data(nodes)
				.enter()
				.append('text')
				.attr('x', x)
				.attr('y', function(d, i) {
				return (i + 1) * x;
			})
				.text(function(d) {
				return d.name;
			});

			texts
				.data(colomns)
				.enter()
				.append('text')
				.attr('x', x + 300)
				.attr('y', function(d, i) {
				return (i + 1) * x;
			})
				.text(function(d) {
				return d.name;
			});
			svg.selectAll('line')
				.data(links)
				.enter()
				.append('line')
				.attr('x1', function() {
				return 150;
			})
				.attr('y1', function(d) {
				return (1 + d.source) * x - 6;
			})
				.attr('x2', function() {
				return 320;
			})
				.attr('y2', function(d) {
				return (1 + d.target) * x - 6;
			})
				.style('stroke', function(d) {
				if (d.pk) {
					return 'hotpink';
				}
				return 'darkgray';
			})
				.style('stroke-dasharray', function(d) {
				if (d.fk) {
					return 10;
				}
				return 0;
			});
		});

		$scope.tableInit = function() {};
	});
})();