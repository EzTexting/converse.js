const chatNumbers = [];
const numberDetails = [];
let roomLength;
let openedNumber = 0;
function modifyRoom(rooms) {
    rooms.forEach((room) => {
        const room_name = room.attributes.id.split('@')[0];
        const chat_number = libphonenumber.parsePhoneNumberFromString(room_name.split('_')[1], 'US');
        const customer_number = libphonenumber.parsePhoneNumberFromString(room_name.split('_')[0], 'US');
        const numbers = {
            from_number: chat_number.formatNational(),
            customer_number: customer_number.formatNational(),
            customer_number_national: customer_number.nationalNumber,
            from_number_e164: chat_number.format('E.164'),
            from_number_national: chat_number.nationalNumber
        };
        room.set(numbers);
        chatNumbers.push(numbers.from_number);
        numberDetails.push(numbers)
    });
}

function updateSidebar() {
    $('.ez-chats').remove();
    $('.open-rooms-list.list-container').prepend('<div class="ez-chats items-list"></div>');
    chatNumbers.forEach(function(item, index){
        const nationalNumber = libphonenumber.parsePhoneNumberFromString(item, 'US').nationalNumber;
        if (chatNumbers.indexOf(item) === index) {
            $('.ez-chats').prepend('<div class="chat-number-container"><h5 class="chat-number-title"><i class="fa fa-mobile"></i>'+ item +'</h5><ul class="chat-number-list chat_number_'+ nationalNumber +'""></ul></div>')
        }
    });
    numberDetails.forEach(function(item){
        const nationalNumber = libphonenumber.parsePhoneNumberFromString(item.from_number, 'US').nationalNumber;
        $('#room_'+ nationalNumber + '_' + item.customer_number_national).clone().appendTo('.ez-chats .chat-number-container .chat_number_' + nationalNumber);
    });
    $('.items-list.rooms-list.open-rooms-list').hide();
}

converse.plugins.add('EZ_Sidebar', {
    initialize: function () {
        const _converse = this._converse;
        _converse.api.listen.on('connected', () => {
            const available_rooms = _converse.api.rooms.get();
            roomLength = available_rooms.length;
            if (available_rooms.length > 0) {
                modifyRoom(available_rooms);
            }
        });
        _converse.api.listen.on('chatRoomOpened', (chatbox) => {
            ++openedNumber;
            if (openedNumber === roomLength) {
                //updateSidebar();
            }
        });
        _converse.api.listen.on('ezRoomOpened', function () {
            //updateSidebar();
        });
    }
});


converse.plugins.add('EZ_RoomJoin', {
    initialize: function () {
        const _converse = this._converse;
        _converse.api.listen.on('connected', () => {
            _converse.api.settings.set(
                {'visible_toolbar_buttons': {
                    'toggle_occupants': false,
                    },
                    'hidden_occupants': true
                }

                );
            const $iq = converse.env.$iq;
            const jid = _converse.api.user.jid();
            const Strophe = converse.env.Strophe;
            const iq = $iq({
                'to': 'sms.xmpp.callfire.com',
                'type': "get"
            }).c("query", {xmlns: Strophe.NS.DISCO_ITEMS});
                _converse.api.sendIQ(iq)
                .then(iq => {
                    const rooms = iq.querySelectorAll('query item');
                    for (let i = 0; i < rooms.length; ++i) {
                        const room = rooms[i].attributes.jid.value;
                        _converse.api.rooms.create(room);
                    }
                    const available_rooms = _converse.api.rooms.get();
                    modifyRoom(available_rooms);
                }).catch(iq => console.log(iq));
        });
    }
});
converse.plugins.add('EZ_RoomPoll', {
    initialize: function () {
        const _converse = this._converse;
        _converse.api.listen.on('connected', () => {
            const $iq = converse.env.$iq;
            const jid = _converse.api.user.jid();
            const Strophe = converse.env.Strophe;
            const iq = $iq({
                'from': jid,
                'to': 'sms.xmpp.callfire.com',
                'type': "get"
            }).c("query", {xmlns: Strophe.NS.DISCO_ITEMS});
            setInterval(function () {
                _converse.api.sendIQ(iq)
                    .then(iq => {
                        const rooms = iq.querySelectorAll('query item');
                        for (let i = 0; i < rooms.length; ++i) {
                            const room = rooms[i].attributes.jid.value;
                            _converse.api.rooms.create(room);
                        }
                        const available_rooms = _converse.api.rooms.get();
                        modifyRoom(available_rooms);
                        console.log(available_rooms);
                    }).catch(iq => console.log(iq));
            }, 30000);
        });
    }
});
