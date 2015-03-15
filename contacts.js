DbContacts = new Mongo.Collection('contacts');
DbGroupes = new Mongo.Collection('groupes');
if (Meteor.isClient) {
    String.prototype.matchAll = function(regexp) {
        var matches = [];
        this.replace(regexp, function() {
            var arr = ([]).slice.call(arguments, 0);
            var extras = arr.splice(-2);
            arr.index = extras[0];
            arr.input = extras[1];
            matches.push(arr);
        });
        return matches.length ? matches : null;
    };
    var stringToColour = function(str) {

    // str to hash
    for (var i = 0, hash = 0; i < str.length; hash = str.charCodeAt(i++) + ((hash << 5) - hash));

    // int/hash to hex
    for (var i = 0, colour = "#"; i < 3; colour += ("00" + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2));

    return colour;
}
    Date.prototype.age = function() { // birthday is a date
        var ageDifMs = Date.now() - this.getTime();
        var ageDate = new Date(ageDifMs); // miliseconds from epoch
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    }
    UI.registerHelper('equals', function(a, b) {
        return a === b;
    });
    Template.contact.helpers({
        groupes: function() {
            return DbGroupes.find({}, {
                sort: {
                    name: 1
                }
            }).fetch();
        }
    });
    Template.contact.events({
        'keydown [contentEditable=true]': function(event) {
            var code = event.keyCode || event.which;
            if (code == 13 || code == 9) {
                event.preventDefault();
                event.stopPropagation();
                $(event.target).blur();
                if (code == 9)
                    $(event.target).nextAll('[contentEditable=true]').first().focus();
            }
        },
        'blur [contentEditable=true]': function(event) {
            var dropdown = $('dropdown[data-target="' + event.target.nodeName.toLowerCase() + '"]');
            setTimeout(function() {
                dropdown.hide();
            }, 100);
            if (event.target.nodeName.toLowerCase() == 'groupe') {
                var cActuel = DbContacts.findOne(Session.get('idContact'));
                if ($(event.target).text() != '') {
                    if (!DbGroupes.findOne({
                            'name': $(event.target).text().toLowerCase()
                        })) {
                        DbGroupes.insert({
                            name: $(event.target).text().toLowerCase()
                        });
                    }
                }
            }
            var nValue = $(event.target).text().replace(/\+([0-9]{2})([0-9]{1})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/, '+$1 $2 $3 $4 $5 $6').replace(/00([0-9]{2})([0-9]{1})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/, '+$1 $2 $3 $4 $5 $6').replace(/([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})([0-9]{2})/, '$1 $2 $3 $4 $5');
            var query = {};
            query['$set'] = {};
            query['$set'][$(event.target).attr('data-field')] = nValue;
            DbContacts.update(Session.get('idContact'), query, function() {
                if (event.target.nodeName.toLowerCase() == 'groupe') {
                    if (!DbContacts.findOne({
                            'groupe': cActuel.groupe
                        })) {
                        var id = DbGroupes.findOne({
                            name: cActuel.groupe
                        })._id;
                        DbGroupes.remove(id);
                    }
                }
            });
        },
        'focus [data-dropdown=true]': function(event) {
            var dropdown = $('dropdown[data-target="' + event.target.nodeName.toLowerCase() + '"]');
            dropdown.show();
            dropdown.css('position', 'fixed');
            dropdown.css('left', $(event.target).offset().left + parseInt($(event.target).css('padding-left')));
            dropdown.css('top', $(event.target).offset().top + $(event.target).height());
        },
        'click dropdown li': function(event) {
            var val = $(event.target).text();
            var target = $(event.target).parent().attr('data-target');
            $('' + target).text(val).blur();
        }
    });
    Template.contact.rendered = function() {
        this.autorun(function() {
            $('[contentEditable=true]').text('');
            var contact = DbContacts.findOne(Session.get('idContact'));
            if (contact) {
                $('firstName').text(contact.name.first);
                $('name').text(contact.name.name);
                $('groupe').text(contact.groupe);
                if (contact.tel) {
                    if (contact.tel.personnal)
                        $('telPersonnal').text(contact.tel.personnal);
                    if (contact.tel.home)
                        $('telHome').text(contact.tel.home);
                    if (contact.tel.office)
                        $('telOffice').text(contact.tel.office);
                }
                if (contact.adress) {
                    $('adress').text(contact.adress.adress);
                    $('cp').text(contact.adress.cp);
                    $('city').text(contact.adress.city);
                    $('country').text(contact.adress.country);
                }
                if (contact.birth) {
                    $('birthDay').text(contact.birth.day);
                    $('birthMonth').text(contact.birth.month);
                    $('birthYear').text(contact.birth.year);
                }
                if (contact.email) {
                    $('emailPersonnal').text(contact.email.personnal);
                    $('emailOffice').text(contact.email.office);
                }
                if (contact.site) {
                    $('site').text(contact.site.url);
                }
                if (contact.etudes) {
                    if (contact.etudes.ecole) {
                        $('ecole').text(contact.etudes.ecole.name);
                        $('disciplineEcole').text(contact.etudes.ecole.discipline);

                    }
                    if (contact.etudes.university) {
                        $('university').text(contact.etudes.university.name);
                        $('disciplineUniversity').text(contact.etudes.university.discipline);
                    }
                }
            }
        });
    };
    Template.body.helpers({
        contacts: function() {
            var contacts = DbContacts.find({}, {
                sort: {
                    'name.name': 1
                }
            }).fetch();
            return contacts;
        },
        data: function(str) {
            if (!str) return '';
            return str.toLowerCase().replace(/\+[0-9]{2}/, '0').replace(/([0-9]{2})\s/g, '$1').replace(/([0-9]{1})\s/g, '$1');
        },
        age: function(str)  {
            var str = new Date(str.year, str.month, str.day);
            return str.age();
        },
        idContact: function() {
            return Session.get('idContact');
        },
        color: function(str) {
            var groupe = DbGroupes.findOne({name:str.toLowerCase()});
            return stringToColour(groupe._id);
        }
    });
    Template.body.events({
        'click contacts li': function(event) {
            $(event.currentTarget).addClass('active').siblings().removeClass('active');
            Session.set('idContact', $(event.currentTarget).attr('data-id'));
        },
        'keyup search input': function(event) {
            if (event.keyCode == 40) {
                $('contacts li:visible').first().click();
                $(event.target).blur();
            }
            if ($(event.target).val() == '') {
                $('contacts li').show();
            } else {
                $('contacts li').hide();
                var txt = $(event.target).val().toLowerCase();
                var regex = /([a-z]+):([a-z0-9éèê]+);/gi;
                var matches = [];
                var match = regex.exec(txt);
                while (match != null) {
                    matches.push(match);
                    match = regex.exec(txt);
                }
                if (matches.length > 0) {
                    for (var key in matches) {
                        if (matches[key][1] == 'ecole') {
                            $('contacts li[data-university*="' + matches[key][2] + '"]').show();
                            $('contacts li[data-ecole*="' + matches[key][2] + '"]').show();
                        } else
                            $('contacts li[data-' + matches[key][1] + '*="' + matches[key][2] + '"]').show();
                    }
                } else {
                    $('contacts li[data-nom*="' + $(event.target).val().toLowerCase() + '"]').show();
                    $('contacts li[data-prenom*="' + $(event.target).val().toLowerCase() + '"]').show();
                    $('contacts li[data-telPersonnal*="' + $(event.target).val().toLowerCase() + '"]').show();
                    $('contacts li[data-telOffice*="' + $(event.target).val().toLowerCase() + '"]').show();
                    $('contacts li[data-telHome*="' + $(event.target).val().toLowerCase() + '"]').show();
                    $('contacts li[data-emailPersonnal*="' + $(event.target).val().toLowerCase() + '"]').show();
                    $('contacts li[data-emailOffice*="' + $(event.target).val().toLowerCase() + '"]').show();
                }
            }
        },
        'click toolbar.add button': function(event) {
            $('.contactCreate').remove();
            $('contacts').prepend('<li tabindex="0" class="contactCreate"><span><input type="text" placeholder="Entrez un nom"></span></li>');
            $('.contactCreate input').focus();
        },
        'blur .contactCreate input': function(event) {
            $(event.target).parent().parent().remove();
        },
        'keyup .contactCreate input': function(event) {
            if (event.keyCode == 13) {
                if ($(event.target).val() == '') {
                    $(event.target).parent().parent().remove();
                } else {
                    $(event.target).parent().parent().hide();
                    DbContacts.insert({
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        name: {
                            name: $(event.target).val()
                        }
                    }, function(err, id) {
                        if (!err) {
                            $('contacts li[data-id="' + id + '"]').click();
                        }
                    });
                }
            }
        }
    });
}

if (Meteor.isServer) {
    Meteor.startup(function() {
        // code to run on server at startup
    });
}