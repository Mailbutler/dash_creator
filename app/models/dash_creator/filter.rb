module DashCreator
  class Filter < ApplicationRecord
    attr_accessor :user_id
    belongs_to :user, class_name: DashCreator.user_class.to_s

    before_validation :set_user

    def as_json (opts={})
      json = {
          'id': id,
          'name': name,
          'options': options
      }
      json
    end

    private
    def set_user
      self.user = DashCreator.user_class.find(user_id)
    end
  end
end
