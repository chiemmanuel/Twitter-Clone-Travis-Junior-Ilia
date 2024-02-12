import React, { useState, useEffect } from 'react';
import axios from '../constants/axios';
import requests from '../constants/requests';
import { socket } from '../socket';
import '../styles/Poll.css';

function Poll({ poll_object }) {
    const user = JSON.parse(localStorage.getItem('user'));

    const has_voted = poll_object.options.some(option => option.voter_ids.includes(user._id));
    const { title, duration_seconds, created_at } = poll_object;
    const [isClosed, setIsClosed] = useState(has_voted ? true : poll_object.isClosed);
    const [options, setOptions] = useState(poll_object.options);
    const closing_time_in_ms = new Date(created_at).getTime() + duration_seconds * 1000;

    useEffect(() => {

        socket.on("poll-vote", data => {
            if (data.poll_id === poll_object._id) {
                setOptions(prevOptions => {
                    let temp_options = [...prevOptions];
                    temp_options[data.option_index].num_votes += 1;
                    temp_options[data.option_index].voter_ids.push(data.voter_id);
                    return temp_options;
                });
            }
        });

        socket.on("poll-close", data => {
            if (data.poll_id === poll_object._id) {
                setIsClosed(true);
            }
        });

        return () => {
            socket.off("poll-vote");
            socket.off("poll-close");
        };
    }, [poll_object._id]);

    const handleVote = (option_index) => {
        if (isClosed) {
            return;
        }
        setOptions(prevOptions => {
            return prevOptions.map((option, index) => {
                if (index === option_index) {
                    return {
                        ...option,
                        num_votes: option.num_votes + 1,
                        voter_ids: [...option.voter_ids, user._id],
                    }
                }
                return option;
            });
        });
        setIsClosed(true);
        axios.post(requests.voteOnPoll, {
            headers: {
                Authorization: `Bearer ${user.token}`,
            },
            poll_id: poll_object._id,
            option_index,
        }).catch(err => console.log(err));
    }

    return (
        <div className="poll">
            <h3 className="poll__title">{title}</h3>
            <ul className='poll__options'>
                {options.map((option, index) => (
                    isClosed ? (
                        <li key={index} className='poll__option' {...option.voter_ids.includes(user._id) ? (className = 'poll__selected_option') : ""}>
                            <p>{option.option_value}</p>
                            <p>{option.num_votes}</p>
                        </li>
                    ) : (
                        <li key={index} className='poll__option' onClick={() => handleVote(index)}>
                            <p>{option.option_value}</p>
                        </li>
                    )
                ))}
            </ul>
            <div className="poll__footer">
                {isClosed ? (
                    <p>Closed</p>
                ) : (
                    <p>Closes at {new Date(closing_time_in_ms).toUTCString()} </p>
                )}
            </div>
        </div>
    )
}

export default Poll;